/**
 * Verify the declared schemastery peer range against real release versions.
 *
 * Two traps this guards, both of which shipped once already:
 *
 * 1. The range must describe *schemastery's* versions, not the harness's.
 *    Schemastery is versioned independently (`3.18.2` while `dsh` is
 *    `0.1.6-alpha.1`); a range copied from the harness version line
 *    (`<0.2.0-0`) matches no published schemastery at all and makes a plain
 *    `npm install` fail with ETARGET.
 * 2. node-semver admits a prerelease only when some comparator shares its exact
 *    major.minor.patch tuple AND itself carries a prerelease tag. A range that
 *    looks broad — `>=3.0.0 <4` — therefore silently excludes `3.19.0-rc.1`.
 *
 * The range is read from `package.json` rather than restated here, so this
 * check cannot drift away from what the package actually declares:
 *
 *   npm test
 *   node tests/peer-range.check.mjs
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadBuildDependency } from './load-dependency.mjs'

const semver = await loadBuildDependency('semver')

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

/** The range under test, read from the manifest that ships it. */
const DECLARED = manifest.peerDependencies?.['@deepseek-ai/schemastery']

if (typeof DECLARED !== 'string') {
  console.error('FAIL package.json declares no @deepseek-ai/schemastery peer range')
  process.exit(1)
}

/** The tempting-looking harness-versioned range that matches nothing. */
const NAIVE = '>=0.1.6-alpha.0 <0.2.0-0 || >=0.1.0-rc.1 <0.1.6'

/** Schemastery versions the range must admit, including the installed one. */
const MUST_MATCH = ['3.18.2', '3.18.3', '3.19.0', '3.99.0']

/** Versions the range must keep out. */
const MUST_EXCLUDE = ['3.18.1', '3.18.1-rc.1', '3.17.0', '4.0.0', '2.0.0', '0.1.6-alpha.1']

let failed = 0
/**
 * Assert one version's membership in the declared range.
 * @param version - the version to test.
 * @param expected - whether the declared range should admit it.
 */
function check(version, expected) {
  const got = semver.satisfies(version, DECLARED)
  const ok = got === expected
  if (!ok) failed += 1
  const naive = semver.satisfies(version, NAIVE)
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${version.padEnd(14)} declared=${String(got).padEnd(5)}`
    + ` (harness-versioned range would say ${naive})`,
  )
}

console.log('declared peer range: ' + DECLARED + '\n')
console.log('must match:')
for (const version of MUST_MATCH) check(version, true)
console.log('\nmust exclude:')
for (const version of MUST_EXCLUDE) check(version, false)

// The prerelease trap: `>=3.18.2 <4` admits `3.19.0` but not `3.19.0-rc.1`,
// because no comparator names the 3.19.0 tuple with a prerelease tag. Print the
// fact instead of asserting it: whether it is acceptable depends on whether the
// harness ever ships a schemastery prerelease, which this check cannot know.
const prerelease = semver.satisfies('3.19.0-rc.1', DECLARED)
console.log('\nprerelease note (not asserted):')
console.log(
  `     3.19.0-rc.1 admitted = ${prerelease}`
  + (prerelease ? '' : ' — add a comparator naming that tuple if the harness ships prereleases'),
)

const total = MUST_MATCH.length + MUST_EXCLUDE.length
console.log(`\n${total - failed}/${total} checks passed`)
process.exit(failed === 0 ? 0 : 1)
