/**
 * Remote Access settings plugin, browser half.
 *
 * Registers the "Remote Access" page over the `remote-access` settings
 * namespace. The host half owns the posture; this half only presents it and
 * writes changes, so the browser never learns the machine's addresses beyond
 * what the operator typed.
 *
 * @module dsh-net-access/client
 */

import { RemoteAccessSection } from './Section.js'
import { RemoteAccessSectionController, REMOTE_ACCESS_NS } from './section-controller.js'
import { en, zh } from './locales.js'

/** Locale namespace this page's copy is registered under. */
const NS = 'settings.remote-access'

/**
 * Required services (cordis fiber inject).
 *
 * The target slot is declared by ui-settings-general's registration, whose
 * activation order relative to this one is not constrained; registration
 * depends on the slot through `slots.inject()`, not on a service edge.
 * `settingsScope` is the binder that turns a namespace into a readable scope.
 */
export const inject = ['slots', 'locale', 'settingsScope']

/**
 * Register the section.
 * @param ctx - client root context.
 */
export function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'remote-access: copy dictionaries')

  const scope = ctx.settingsScope.bind({
    namespace: REMOTE_ACCESS_NS,
    decode: (section) => (typeof section === 'object' && section !== null ? section : undefined),
  })
  const controller = new RemoteAccessSectionController(scope, ctx)
  const t = ctx.locale.bind(NS)

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'remote-access',
    order: 30,
    label: () => t('nav'),
    inject: () => ({ ...controller.inject(), t }),
  }, RemoteAccessSection))
}
