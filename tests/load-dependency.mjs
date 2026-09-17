/**
 * Resolve a build-time dependency from the likely install roots.
 *
 * The plugin is developed beside a harness checkout that has these packages
 * installed by pnpm, but pnpm keeps them under
 * `node_modules/.pnpm/<name>@<version>/node_modules/`, which is not on any
 * resolution path, so that layout is scanned explicitly. This mirrors the
 * resolver in scripts/build.mjs so the checks run against a fresh clone
 * without a local install step.
 */
import { readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

/**
 * Load a package by name from the plugin, its sibling checkout, or pnpm's store.
 * @param specifier - the package to load.
 * @returns the resolved module namespace.
 */
export async function loadBuildDependency(specifier) {
  const bases = [
    join(root, 'node_modules'),
    join(root, '..', 'deepseek-harness'),
    join(root, '..', 'deepseek-harness', 'node_modules'),
  ]
  for (const base of bases) {
    try {
      return createRequire(join(base, 'noop.js'))(specifier)
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error
    }
    const store = join(base, 'node_modules', '.pnpm')
    let entries = []
    try {
      entries = await readdir(store)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      continue
    }
    const candidates = entries
      .filter(name => name === specifier || name.startsWith(`${specifier}@`))
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
    `dsh-net-access: cannot resolve ${specifier} for this check. `
    + 'Install it in the harness checkout (`pnpm install`) beside this plugin.',
  )
}
