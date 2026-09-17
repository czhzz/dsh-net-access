/**
 * Verify the declared harness peer range against real DSH release versions.
 *
 * node-semver admits a prerelease only when some comparator shares its exact
 * major.minor.patch tuple AND itself carries a prerelease tag. A range that
 * looks broad — `>=0.0.1-rc.1 <0.2.0` — therefore silently excludes every
 * harness prerelease, including the installed `0.1.6-alpha.1`, and users hit an
 * ERESOLVE they must resolve by hand.
 *
 * This asserts the declared range admits the harness builds users run and keeps
 * out other minor lines. Run it after changing `peerDependencies`:
 *
 *   node tests/peer-range.check.mjs
 *
 * It resolves `semver` from the checkout beside this plugin, like the build.
 */
import { loadBuildDependency } from './load-dependency.mjs'

const semver = await loadBuildDependency('semver')

/** The range under test must be the one the package actually declares. */
const DECLARED = '>=0.1.6-alpha.0 <0.2.0-0 || >=0.1.0-rc.1 <0.1.6'

/** The tempting-looking range that silently fails; kept to document the trap. */
const NAIVE = '>=0.0.1-rc.1 <0.2.0'

/** Harness versions the range must admit. */
const MUST_MATCH = ['0.1.6-alpha.1', '0.1.0-rc.6', '0.1.5', '0.1.0']

/** Other minor lines the range must keep out. */
const MUST_EXCLUDE = ['0.2.0', '1.0.0']

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
    + ` (naive ">=0.0.1-rc.1 <0.2.0" would say ${naive})`,
  )
}

console.log('declared peer range: ' + DECLARED + '\n')
console.log('must match:')
for (const version of MUST_MATCH) check(version, true)
console.log('\nmust exclude:')
for (const version of MUST_EXCLUDE) check(version, false)

const total = MUST_MATCH.length + MUST_EXCLUDE.length
console.log(`\n${total - failed}/${total} checks passed`)
process.exit(failed === 0 ? 0 : 1)
