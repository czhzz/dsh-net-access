/**
 * Build the host and client halves.
 *
 * The host half is plain ESM the runtime executes directly, so it is copied.
 * The client half is assembled by esbuild into the single-file factory DSH's
 * module loader expects: the browser never resolves a bare specifier itself, so
 * every dependency is either on the platform's module table (kept external) or
 * inlined here.
 *
 * esbuild is resolved from wherever it is installed rather than declared, so
 * this package does not carry a native binary as a dependency of its own. It is
 * a build-time tool: nothing it produces needs it at runtime.
 */
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const lib = join(root, 'lib')

/** This plugin's id: the loader registers the client bundle under it. */
const PLUGIN_ID = 'dsh-remote-access'

/**
 * The module table DSH seeds before any client bundle runs.
 *
 * Anything listed stays a `require()` call in the output and is answered by the
 * browser's loader. Everything else is bundled in, because a bare specifier the
 * table does not carry would throw at materialization.
 */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]
/**
 * Resolve a build-time dependency from the likely install roots.
 *
 * The plugin is developed beside a checkout that has these packages installed
 * by pnpm, but it is installed into a profile as a standalone directory, so
 * neither `import` nor a bare `require` from here reliably finds them. pnpm
 * keeps packages under `node_modules/.pnpm/<name>@<version>/node_modules/`,
 * which is not on any resolution path, so that layout is scanned explicitly.
 * @param specifier - the package to resolve.
 * @returns the resolved module namespace.
 */
async function loadBuildDependency(specifier) {
  const roots = [
    join(root, 'node_modules'),
    join(root, '..', 'deepseek-harness'),
    join(root, '..', 'deepseek-harness', 'node_modules'),
  ]
  for (const base of roots) {
    try {
      return createRequire(join(base, 'noop.js'))(specifier)
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error
    }
    // pnpm's virtual store: pick the highest version present.
    const store = join(base, 'node_modules', '.pnpm')
    let entries = []
    try {
      entries = await readdir(store)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      continue
    }
    const candidates = entries
      .filter((name) => name === specifier || name.startsWith(`${specifier}@`))
      .sort()
      .reverse()
    for (const candidate of candidates) {
      const pkg = join(store, candidate, 'node_modules', specifier)
      try {
        return createRequire(join(pkg, 'noop.js'))(pkg)
      } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND' && error.code !== 'ERR_MODULE_NOT_FOUND') throw error
      }
    }
  }
  throw new Error(
    `dsh-remote-access: cannot resolve ${specifier} for the build. `
    + 'Install it in the harness checkout (`pnpm install`), or add it here.',
  )
}

const esbuild = await loadBuildDependency('esbuild')

/** Compiled CSS Modules come from lightningcss, the same transform the shell uses. */
const { transform } = await loadBuildDependency('lightningcss')

/**
 * CSS Modules loader.
 *
 * A `.module.css` import yields the hashed class map, and the compiled sheet is
 * injected once per plugin through a tagged `<style>` element. DSH's own preset
 * emits exactly this for its dynamic client bundles; the tag is what keeps a
 * hot-reloaded bundle from stacking a second copy of the same sheet.
 * @param pluginId - owning plugin id, used for the injection tag and the
 *   data attributes that identify the sheet in the document.
 * @returns an esbuild plugin.
 */
function cssModules(pluginId) {
  return {
    name: 'dsh-css-modules',
    setup(build) {
      build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
        const source = await readFile(args.path, 'utf8')
        const { code, exports } = transform({
          filename: args.path,
          code: Buffer.from(source),
          minify: true,
          cssModules: { pattern: '[hash]_[local]' },
        })
        const tagId = `${pluginId}/${basename(args.path)}`
        const contents = [
          `const css = ${JSON.stringify(code.toString())};`,
          `const tagId = ${JSON.stringify(tagId)};`,
          "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {",
          "  const tag = document.createElement('style');",
          `  tag.dataset.plugin = ${JSON.stringify(pluginId)};`,
          '  tag.dataset.pluginCss = tagId;',
          '  tag.textContent = css;',
          '  document.head.appendChild(tag);',
          '}',
          `export default ${JSON.stringify(exports ?? {})};`,
        ].join('\n')
        return { contents, loader: 'js' }
      })
    },
  }
}

await rm(lib, { recursive: true, force: true })
await mkdir(lib, { recursive: true })

// Host half: copied, so a stack trace names the file that was edited.
await cp(join(root, 'src', 'index.js'), join(lib, 'index.js'))
await cp(join(root, 'src', 'detect.js'), join(lib, 'detect.js'))

// Client half: one CJS factory wrapped for the loader. The wrapper is the
// loader's registration protocol, not a bundler artifact of this package.
const bundle = await esbuild.build({
  entryPoints: [join(root, 'src', 'client', 'index.js')],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'transform',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  external: PLATFORM_MODULES,
  plugins: [cssModules(PLUGIN_ID)],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  logLevel: 'warning',
})

const body = bundle.outputFiles[0].text
const wrapped = 'window.__ModuleLoader__.load({ id: "dsh-remote-access", '
  + 'factory: (require) => { var module = { exports: {} }; var exports = module.exports;\n'
  + body
  + '\nreturn module.exports; } });\n'

await writeFile(join(lib, 'client.js'), wrapped, 'utf8')

const externals = PLATFORM_MODULES.filter((specifier) => wrapped.includes(`require("${specifier}")`))
await writeFile(
  join(lib, 'build-info.json'),
  `${JSON.stringify({ clientExternals: externals }, null, 2)}\n`,
  'utf8',
)

console.log(`dsh-remote-access: wrote lib/ (client externals: ${externals.join(', ') || 'none'})`)
