/**
 * Behavioral tests for dsh-net-access.
 *
 * Fixtures use the network shape of a real developer machine, where the
 * Tailscale adapter is one of many non-internal IPv4 interfaces. That shape is
 * the reason this plugin exists, so it is the shape worth asserting against.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { isCgnatAddress, isTailscaleInterface, resolveTailnetAddress } from '../src/detect.js'
import { Config, localAddresses, plan, resolveAddress } from '../src/index.js'
import { OPEN_MODES, crossesBind, needsRestart } from '../src/client/section-controller.js'

/** A machine with Tailscale plus VMware, WSL, Hyper-V, and a real LAN. */
const DEV_MACHINE = {
  Tailscale: [{ address: '100.64.0.10', family: 'IPv4', internal: false }],
  '以太网': [{ address: '192.0.2.10', family: 'IPv4', internal: false }],
  'VMware Network Adapter VMnet1': [{ address: '198.51.100.10', family: 'IPv4', internal: false }],
  'vEthernet (WSL (Hyper-V firewall))': [{ address: '203.0.113.10', family: 'IPv4', internal: false }],
  'Loopback Pseudo-Interface 1': [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
}

/** The same machine with no Tailscale adapter at all. */
const NO_TAILSCALE = {
  '以太网': [{ address: '192.0.2.10', family: 'IPv4', internal: false }],
}

test('detects the tailnet address and ignores unrelated adapters', () => {
  assert.equal(resolveTailnetAddress(DEV_MACHINE), '100.64.0.10')
})

test('accepts the numeric IPv4 family form', () => {
  const numeric = { Tailscale: [{ address: '100.1.2.3', family: 4, internal: false }] }
  assert.equal(resolveTailnetAddress(numeric), '100.1.2.3')
})

test('recognises the adapter name on every platform spelling', () => {
  for (const name of ['Tailscale', 'tailscale0', 'tailscale1', 'TAILSCALE']) {
    assert.equal(isTailscaleInterface(name), true, name)
  }
  for (const name of ['Ethernet', 'Tailscale-extra', 'notailscale']) {
    assert.equal(isTailscaleInterface(name), false, name)
  }
})

test('classifies the CGNAT range boundaries', () => {
  assert.equal(isCgnatAddress('100.64.0.1'), true)
  assert.equal(isCgnatAddress('100.127.255.254'), true)
  assert.equal(isCgnatAddress('100.63.255.255'), false)
  assert.equal(isCgnatAddress('100.128.0.1'), false)
  assert.equal(isCgnatAddress('192.168.1.1'), false)
})

test('prefers the named adapter over a CGNAT coincidence', () => {
  const both = {
    'Other Mesh': [{ address: '100.64.0.9', family: 'IPv4', internal: false }],
    Tailscale: [{ address: '100.64.0.10', family: 'IPv4', internal: false }],
  }
  assert.equal(resolveTailnetAddress(both), '100.64.0.10')
})

test('collects every local IPv4 and skips loopback', () => {
  assert.deepEqual(localAddresses(DEV_MACHINE), [
    '100.64.0.10',
    '192.0.2.10',
    '198.51.100.10',
    '203.0.113.10',
  ])
})

test('off closes the port by binding loopback', () => {
  const p = plan(Config({ mode: 'off' }), { trustedHosts: [] }, DEV_MACHINE)
  assert.equal(p.bindHost, '127.0.0.1')
  assert.deepEqual(p.trustedHosts, [])
  assert.equal(p.warning, undefined)
})

test('local binds all interfaces but trusts only loopback', () => {
  const p = plan(Config({ mode: 'local' }), { trustedHosts: [] }, DEV_MACHINE)
  assert.equal(p.bindHost, '0.0.0.0')
  assert.deepEqual(p.trustedHosts, [])
})

test('tailscale binds all interfaces and trusts only the tailnet address', () => {
  const p = plan(Config({ mode: 'tailscale' }), { trustedHosts: [] }, DEV_MACHINE)
  assert.equal(p.bindHost, '0.0.0.0')
  assert.deepEqual(p.trustedHosts, ['100.64.0.10'])
  assert.equal(p.address, '100.64.0.10')
})

test('all trusts every local IPv4, matching upstream LAN sampling', () => {
  const p = plan(Config({ mode: 'all' }), { trustedHosts: [] }, DEV_MACHINE)
  assert.equal(p.bindHost, '0.0.0.0')
  assert.deepEqual(p.trustedHosts, [
    '100.64.0.10',
    '192.0.2.10',
    '198.51.100.10',
    '203.0.113.10',
  ])
})

test('an explicit address overrides detection', () => {
  const config = Config({ mode: 'tailscale', address: '100.1.1.1' })
  assert.equal(resolveAddress(config, {}), '100.1.1.1')
  assert.deepEqual(plan(config, { trustedHosts: [] }, DEV_MACHINE).trustedHosts, ['100.1.1.1'])
})

test('a tailnet posture with no tailnet address degrades to off and reports why', () => {
  const p = plan(Config({ mode: 'tailscale' }), { trustedHosts: [] }, NO_TAILSCALE)
  assert.equal(p.mode, 'off')
  assert.deepEqual(p.trustedHosts, [])
  assert.match(p.warning, /no tailnet address/u)
})

test('merges CLI and configured extras into every posture', () => {
  const config = Config({ mode: 'tailscale', extraTrustedHosts: ['extra.internal'] })
  const p = plan(config, { trustedHosts: ['from-cli.internal'] }, DEV_MACHINE)
  assert.deepEqual(p.trustedHosts, ['100.64.0.10', 'from-cli.internal', 'extra.internal'])
})

test('deduplicates authorities across sources', () => {
  const config = Config({ mode: 'tailscale', extraTrustedHosts: ['100.64.0.10'] })
  assert.deepEqual(plan(config, { trustedHosts: [] }, DEV_MACHINE).trustedHosts, ['100.64.0.10'])
})

test('defaults to the local posture', () => {
  assert.equal(Config({}).mode, 'local')
  const p = plan(Config({}), { trustedHosts: [] }, DEV_MACHINE)
  assert.equal(p.bindHost, '0.0.0.0')
  assert.deepEqual(p.trustedHosts, [])
})

test('only off changes the bind, so only off crosses the restart divide', () => {
  assert.equal(needsRestart('off'), true)
  for (const mode of ['local', 'tailscale', 'all']) assert.equal(needsRestart(mode), false, mode)

  // Every open posture interchanges live.
  for (const from of OPEN_MODES) {
    for (const to of OPEN_MODES) assert.equal(crossesBind(from, to), false, `${from} -> ${to}`)
  }
  // Entering or leaving off does not.
  assert.equal(crossesBind('local', 'off'), true)
  assert.equal(crossesBind('off', 'tailscale'), true)
  assert.equal(crossesBind('off', 'off'), false)
})
