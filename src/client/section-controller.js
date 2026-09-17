/**
 * The Remote Access settings page's state over the `remote-access` namespace.
 *
 * The page shows one choice plus two optional refinements. It reads the live
 * settings scope rather than staging the whole form, because the interesting
 * fact is which posture is *in force*: the socket binds once at startup, so a
 * posture that changes the bind cannot be honored until a restart. The page
 * therefore reports the applied posture alongside the selected one instead of
 * claiming a switch that has not happened.
 *
 * @module dsh-remote-access/client/section-controller
 */

/** Namespace of this plugin. Spelled here rather than imported: a client bundle must not depend on a host module. */
export const REMOTE_ACCESS_NS = 'remote-access'

/** Every posture, ordered from most restricted to most open. */
export const MODES = ['off', 'local', 'tailscale', 'all']

/**
 * The postures that keep the listening socket on all interfaces.
 *
 * They differ only in which authorities the fence admits, so they interchange
 * live. `off` is excluded: it binds loopback, which is what closes the port and
 * what makes it the posture that needs a restart.
 */
export const OPEN_MODES = ['local', 'tailscale', 'all']

/**
 * Whether a posture closes the port by binding loopback.
 *
 * @param mode - the posture to classify.
 * @returns true when applying this posture needs a restart.
 */
export function needsRestart(mode) {
  return mode === 'off'
}

/**
 * Whether switching between two postures requires a restart.
 *
 * Only `off` moves the bind, and the fence is read per request, so the other
 * three interchange live.
 *
 * @param from - the posture currently applied.
 * @param to - the posture being selected.
 * @returns true when the switch needs a restart.
 */
export function crossesBind(from, to) {
  if (from === undefined || to === undefined) return false
  return needsRestart(from) !== needsRestart(to)
}

/**
 * Bridge the `remote-access` settings scope onto the page.
 *
 * Reads go through the scope's snapshot so the page re-renders on any settings
 * write, including one made from another surface.
 */
export class RemoteAccessSectionController {
  /**
   * @param scope - the bound settings scope for the `remote-access` namespace.
   * @param ctx - the page plugin's context, used for the detected-address probe.
   */
  constructor(scope, ctx) {
    this.scope = scope
    this.ctx = ctx
  }

  /** The resolved posture, falling back to the safe default. */
  get mode() {
    return this.scope.getSnapshot().value?.mode ?? 'local'
  }

  /** The configured tailnet address override, if any. */
  get address() {
    return this.scope.getSnapshot().value?.address ?? ''
  }

  /** Extra authorities the operator declared. */
  get extraTrustedHosts() {
    return this.scope.getSnapshot().value?.extraTrustedHosts ?? []
  }

  /**
   * The posture the running server was started with.
   *
   * Until a restart this can differ from {@link mode}, and the page says so.
   * The host reports the applied posture through the settings snapshot's `base`
   * layer when available; otherwise the selected value is the best answer.
   * @returns the posture believed to be in force.
   */
  get appliedMode() {
    const snapshot = this.scope.getSnapshot()
    return snapshot.base?.mode ?? snapshot.value?.mode ?? 'local'
  }

  /**
   * Write a posture.
   *
   * The write is immediate rather than staged behind Save: the page's whole
   * point is to report what is in force, and a staged value would leave the
   * badge describing a state the host does not hold.
   * @param next - the posture the user selected.
   * @returns a promise resolving when the write settles.
   */
  setMode(next) {
    return this.scope.set('mode', next)
  }

  /**
   * Write the tailnet address override.
   * @param value - the address, or an empty string to return to detection.
   * @returns a promise resolving when the write settles.
   */
  setAddress(value) {
    return this.scope.set('address', value)
  }

  /**
   * Write the extra allowed authorities.
   * @param values - the authorities to accept.
   * @returns a promise resolving when the write settles.
   */
  setExtraTrustedHosts(values) {
    return this.scope.set('extraTrustedHosts', values)
  }

  /**
   * Build the face the page's slot registration injects.
   *
   * `hooks.remoteAccess` becomes the `useRemoteAccess` selector hook the
   * renderer binds, so the source must be a bare observable — and the settings
   * scope already is one, exposing `getSnapshot()` and `subscribe()`. Reading
   * through the scope rather than a private store keeps the page on the public
   * contract and makes it re-render on any write, including one made from
   * another surface.
   * @returns the observable source and the page's write actions.
   */
  inject() {
    return {
      // A stable getter, not a captured value: the renderer and the actions
      // must agree on which scope is current.
      hooks: { remoteAccess: this.scope },
      setMode: (next) => void this.setMode(next),
      setAddress: (value) => void this.setAddress(value),
      setExtraTrustedHosts: (values) => void this.setExtraTrustedHosts(values),
    }
  }
}
