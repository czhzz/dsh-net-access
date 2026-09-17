/**
 * The Remote Access settings section.
 *
 * The page follows the settings-page field idiom: each decision is a labelled
 * field with its control on the head line and its explanation beneath.
 *
 * The postures are ordered by what they do to the listener, because that is
 * what decides whether a change needs a restart. `local` is the only posture
 * that rebinds the socket to loopback — it is the one that actually closes the
 * port — so it is named for that and stands apart from the three postures that
 * keep the socket open and differ only in who the fence admits.
 *
 * The page reads its state through the framework-bound `useRemoteAccess`
 * selector hook that the renderer synthesizes from this plugin's `hooks`
 * compartment. Subscribing by hand here would be a second source of truth for a
 * fact the framework already owns.
 *
 * @module dsh-remote-access/client/Section
 */

import { createElement as h } from 'react'
import { Pill, Switch, Tag } from '@deepseek-ai/dsh-client-ui-primitives'
import { OPEN_MODES, crossesBind } from './section-controller.js'
import styles from './Section.module.css'

/**
 * Copy key for one selectable posture's label.
 *
 * `off` is absent on purpose: it is the switch's off state, not a choice in the
 * strip, and it is named by the switch's own hint.
 */
const LABEL = {
  local: 'modeLocal',
  tailscale: 'modeTailscale',
  all: 'modeAll',
}

/** Copy key for one selectable posture's explanation. */
const HINT = {
  local: 'modeLocalHint',
  tailscale: 'modeTailscaleHint',
  all: 'modeAllHint',
}

/**
 * Render the Remote Access settings page.
 *
 * Every injected member is optional: the slot may render this component before
 * the registrant's face is bound, and returning null then is better than
 * throwing inside a slot entry.
 * @param props - locale copy, the section hook, and the page's write actions.
 * @returns the section, or null while the injected face is incomplete.
 */
export function RemoteAccessSection(props) {
  const { t, useRemoteAccess, setMode, setAddress, setExtraTrustedHosts } = props
  if (
    t === undefined || useRemoteAccess === undefined || setMode === undefined
    || setAddress === undefined || setExtraTrustedHosts === undefined
  ) return null

  const state = useRemoteAccess((snapshot) => snapshot)
  const mode = state?.value?.mode ?? 'local'
  const applied = state?.base?.mode ?? mode
  const writable = state?.writable !== false

  if (state?.status === 'unavailable') return h('p', { className: styles.intro }, t('unavailable'))

  const restartPending = crossesBind(applied, mode)
  // The switch reads as "reachable from other devices"; `off` closes the port,
  // so it is the switch's off state.
  const exposed = mode !== 'off'

  return h(
    'div',
    null,
    h('p', { className: styles.intro, key: 'intro' }, t('intro')),

    h(
      'div',
      { className: styles.field, key: 'toggle' },
      h(
        'div',
        { className: styles.head },
        h('span', { className: styles.label }, t('exposeLabel')),
        h(Switch, {
          checked: exposed,
          label: t('exposeLabel'),
          disabled: !writable,
          onChange: (next) => setMode(next ? 'local' : 'off'),
        }),
      ),
      h('p', { className: styles.hint }, exposed ? t('exposeOnHint') : t('modeOffHint')),
    ),

    exposed
      ? h(
        'div',
        { className: styles.field, key: 'scope' },
        h(
          'div',
          { className: styles.head },
          h('span', { className: styles.label }, t('modeLabel')),
          restartPending
            ? h('span', { className: styles.badges }, h(Tag, { tone: 'warning', children: t('pendingLabel') }))
            : h('span', { className: styles.badges }, h(Tag, { tone: 'success', children: t('appliedLabel') })),
        ),
        h(
          'div',
          { className: styles.choices, role: 'radiogroup', 'aria-label': t('modeLabel') },
          ...OPEN_MODES.map((option) => h(Pill, {
            key: option,
            active: mode === option,
            onClick: writable ? () => setMode(option) : undefined,
            children: t(LABEL[option]),
          })),
        ),
        h('p', { className: styles.hint }, t(HINT[mode])),
      )
      : null,

    restartPending
      ? h(
        'p',
        { className: styles.restartNote, key: 'restart' },
        t('restartTitle') + ' — ' + t('restartBody') + ' ',
        h('code', { className: styles.command }, 'dsh --profile web'),
      )
      : null,

    mode === 'tailscale'
      ? h(
        'div',
        { className: styles.field, key: 'address' },
        h('div', { className: styles.head }, h('label', { className: styles.label, htmlFor: 'remote-access-address' }, t('addressLabel'))),
        h('input', {
          id: 'remote-access-address',
          className: styles.input,
          type: 'text',
          value: state?.value?.address ?? '',
          placeholder: t('addressPlaceholder'),
          disabled: !writable,
          onChange: (event) => setAddress(event.target.value),
        }),
        h('p', { className: styles.hint }, t('addressHint')),
      )
      : null,

    // The allow-list only qualifies an open port: with the port closed nothing
    // can reach it, so the field would describe a fence with no gate.
    exposed
      ? h(
        'div',
        { className: styles.field, key: 'extra' },
        h('div', { className: styles.head }, h('label', { className: styles.label, htmlFor: 'remote-access-extra' }, t('extraLabel'))),
        h('textarea', {
          id: 'remote-access-extra',
          className: styles.textarea,
          rows: 2,
          disabled: !writable,
          value: (state?.value?.extraTrustedHosts ?? []).join('\n'),
          onChange: (event) => setExtraTrustedHosts(
            event.target.value.split('\n').map((line) => line.trim()).filter((line) => line !== ''),
          ),
        }),
        h('p', { className: styles.hint }, t('extraHint')),
      )
      : null,
  )
}
