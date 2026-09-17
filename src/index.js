/**
 * dsh-remote-access — control how the DeepSeek Harness Web GUI is reachable.
 *
 * DSH already ships everything needed to serve a non-loopback browser: the
 * webserver accepts an all-interfaces bind, and `dsh-client-connection` fences
 * every `/api` request behind a Host/Origin check that admits loopback plus the
 * authorities a deployment declares. What upstream withholds is the control:
 * `dsh-web-app`'s `web-startup` provider rejects `--host 0.0.0.0` outright, and
 * its LAN trust sampler derives from *every* non-internal IPv4, which on a
 * developer machine means the LAN, VMware, WSL, Hyper-V, and OpenVPN host-only
 * networks together.
 *
 * This plugin turns reachability into one setting with four postures:
 *
 * - `off` closes the port: it binds loopback, so nothing off this machine can
 *   even connect.
 * - `local` binds all interfaces and admits loopback alone, so the port is
 *   visible to a scan but no other device gets through.
 * - `tailscale` binds all interfaces and trusts only the tailnet address.
 * - `all` binds all interfaces and trusts every local IPv4 address.
 *
 * Three of the four bind all interfaces on purpose. `dsh-host-webserver`
 * declares `host` as a closed union of exactly `127.0.0.1` and `0.0.0.0`, and
 * `listen()` runs once at activation with no rebind path, so a socket that
 * binds loopback can never be reopened without restarting the process. Keeping
 * the socket at all-interfaces and expressing the posture in the trust fence
 * instead is what lets `local`, `tailscale`, and `all` switch live from the
 * settings page. `off` is the one posture that changes the bind, and it is
 * therefore the one that needs a restart.
 *
 * @module dsh-remote-access
 */

import { networkInterfaces } from 'node:os'
import z from '@deepseek-ai/schemastery'
import { resolveTailnetAddress } from './detect.js'

/** Stable Cordis plugin name. */
export const name = 'remote-access'

/**
 * Service this plugin provides for the bundle patch to read.
 *
 * The patch cannot read the settings namespace directly: a `!!js` expression is
 * evaluated once at boot, so it would capture a value rather than track
 * changes. This service therefore exposes functions the patch resolves per
 * request, letting a settings write reach the transport without the loader
 * re-evaluating anything.
 */
export const REMOTE_ACCESS_SERVICE = 'remoteAccess'

/** Services required before the plugin can act. */
export const inject = ['webStartup']

/** Settings namespace owning this plugin's posture. */
export const NS = 'remote-access'

/**
 * Reachability posture.
 *
 * `local` keeps the socket on all interfaces and admits loopback alone, so it
 * interchanges live with the other open postures. `off` is the only posture
 * that binds loopback — the one that actually closes the port to the network —
 * and therefore the only one that needs a restart.
 */
const Mode = z.union([
  z.const('local'),
  z.const('tailscale'),
  z.const('all'),
  z.const('off'),
])

/** Plugin configuration, also the settings schema for {@link NS}. */
export const Config = z.object({
  /** Which authorities may reach the GUI. */
  mode: Mode.default('local'),
  /**
   * Tailnet address override. Empty means detect the Tailscale adapter.
   *
   * Detection can legitimately be wrong: a host running a second
   * CGNAT-addressed overlay, or one reached through a MagicDNS name rather than
   * an interface, needs the authority pinned by hand.
   */
  address: z.string().default(''),
  /** Extra authorities the fence accepts, beyond what the posture derives. */
  extraTrustedHosts: z.array(String).default([]),
})

/**
 * Collect every non-internal IPv4 address the host currently holds.
 *
 * @param interfaces - an `os.networkInterfaces()` snapshot.
 * @returns the host's local IPv4 literals, in interface order.
 */
export function localAddresses(interfaces) {
  const found = []
  for (const entries of Object.values(interfaces)) {
    if (entries === undefined) continue
    for (const entry of entries) {
      // `family` is 'IPv4' on every currently supported Node release; the
      // numeric form is accepted for forward compatibility.
      const isV4 = entry.family === 'IPv4' || entry.family === 4
      if (isV4 && !entry.internal) found.push(entry.address)
    }
  }
  return found
}

/**
 * Resolve the effective tailnet address for this boot.
 *
 * @param config - validated configuration.
 * @param interfaces - network-interface snapshot, injected for testability.
 * @returns the configured or detected address, or undefined when neither exists.
 */
export function resolveAddress(config, interfaces) {
  if (config.address !== '') return config.address
  return resolveTailnetAddress(interfaces)
}

/**
 * Build the reachability plan for one posture.
 *
 * @param config - validated configuration.
 * @param startup - the upstream `webStartup` value carrying the CLI fence.
 * @param interfaces - network-interface snapshot, injected for testability.
 * @returns the plan for this posture, including a diagnostic when it could not be honored.
 */
export function plan(config, startup, interfaces) {
  const extra = [...new Set([...(startup?.trustedHosts ?? []), ...config.extraTrustedHosts])]

  // `off` closes the port: loopback is the only bind that hides it from the
  // network, so it is also the only posture that cannot be entered or left
  // while the process runs. Every other posture keeps the socket open and
  // differs solely in which authorities the fence admits.
  const bindHost = config.mode === 'off' ? '127.0.0.1' : '0.0.0.0'

  // Loopback is the one authority DSH's fence always admits, so `local` and
  // `off` derive nothing and rely on it.
  if (config.mode === 'local' || config.mode === 'off') {
    return { mode: config.mode, bindHost, address: undefined, trustedHosts: extra, warning: undefined }
  }

  if (config.mode === 'all') {
    return {
      mode: config.mode,
      bindHost,
      address: undefined,
      trustedHosts: [...new Set([...localAddresses(interfaces), ...extra])],
      warning: undefined,
    }
  }

  const address = resolveAddress(config, interfaces)
  if (address === undefined) {
    // A tailnet posture with no tailnet address would otherwise fall through to
    // an empty fence and silently behave like `off` on an all-interfaces bind.
    // Degrading to `off` keeps the exposure the operator asked for off, and the
    // warning tells them why nothing changed.
    return {
      mode: 'off',
      bindHost,
      address: undefined,
      trustedHosts: extra,
      warning:
        'no tailnet address found, so the posture fell back to "off". '
        + 'Check that Tailscale is running, or set the address on the settings page.',
    }
  }

  // Port-less by design: DNS rebinding needs an attacker-controlled *name*, so
  // an IP-literal Host is safe on any port while the served port may vary.
  return { mode: config.mode, bindHost, address, trustedHosts: [...new Set([address, ...extra])], warning: undefined }
}

/**
 * Mount the plugin: resolve the posture and expose it to the bundle patch.
 *
 * The service exposes functions rather than values because the patch reads
 * reachability per request. A captured value would freeze the posture at boot
 * and defeat the settings page.
 *
 * @param ctx - plugin context carrying `webStartup`.
 * @param raw - unvalidated plugin configuration.
 */
export function apply(ctx, raw) {
  const entry = Config(raw)
  const logger = ctx.logger ?? console

  // Live source, repointed by `installSection` once the settings service
  // mounts. Before that it reads the composition entry, so a deployment with no
  // settings provider still works from cordis.yml alone.
  let current = () => entry
  const read = () => plan(current(), ctx.get('webStartup'), networkInterfaces())

  const service = {
    /** The posture in force right now. */
    mode: () => read().mode,
    /** The bind host this boot composed; fixed for the process lifetime. */
    bindHost: () => read().bindHost,
    /** The authorities the fence admits right now. */
    trustedHosts: () => read().trustedHosts,
    /** The resolved tailnet address, when the posture uses one. */
    address: () => read().address,
    /** Diagnostic for a posture that could not be honored, if any. */
    warning: () => read().warning,
  }
  ctx.provide(REMOTE_ACCESS_SERVICE, service)

  const report = () => {
    const now = read()
    if (now.warning !== undefined) logger.error?.(`remote-access: ${now.warning}`)
    logger.info?.(
      `remote-access: posture "${now.mode}"; binding ${now.bindHost} `
      + `and trusting ${now.trustedHosts.join(', ') || '(loopback only)'}`,
    )
  }

  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, NS, Config, entry, {
      setSource: (source) => {
        current = source
      },
      onChange: report,
    })
  })

  report()
}
