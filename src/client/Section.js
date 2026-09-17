/**
 * The Remote Access settings section.
 *
 * The page follows the settings-page section idiom: a titled column of cards
 * and fields at the page's max width, the same shell `ui-agent-preset` and
 * `ui-settings-plugins` render.
 *
 * The postures are ordered by what they do to the listener, because that is
 * what decides whether a change needs a restart. `local` is the only posture
 * that rebinds the socket to loopback — it is the one that actually closes the
 * port — so it is named for that and stands apart from the three postures that
 * keep the socket open and differ only in who the fence admits.
 *
 * The postures are cards rather than a strip of pills, and each carries its own
 * description: the three are told apart by what they admit, so showing only the
 * selected one hides the answer at the moment the comparison is being made.
 *
 * The page reads its state through the framework-bound `useRemoteAccess`
 * selector hook that the renderer synthesizes from this plugin's `hooks`
 * compartment. Subscribing by hand here would be a second source of truth for a
 * fact the framework already owns.
 *
 * @module dsh-net-access/client/Section
 */

import { createElement as h } from 'react'
import {
  IconGlobeOutline14, IconLinkOutline16, IconUserOutline16, IconWarningOutline16,
  Switch, Tag,
} from '@deepseek-ai/dsh-client-ui-primitives'
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
 * Glyph for one selectable posture.
 *
 * A person, a link and a globe: who the fence admits, drawn as the three things
 * the postures actually differ by. Sizes are normalized so the three read at one
 * weight rather than at whatever box each glyph was authored on.
 */
const ICON = {
  local: IconUserOutline16,
  tailscale: IconLinkOutline16,
  all: IconGlobeOutline14,
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

  if (state?.status === 'unavailable') {
    return h(
      'div',
      { className: styles.section },
      h('p', { className: styles.intro }, t('unavailable')),
    )
  }

  const restartPending = crossesBind(applied, mode)
  // The switch reads as "reachable from other devices"; `off` closes the port,
  // so it is the switch's off state.
  const exposed = mode !== 'off'

  return h(
    'div',
    { className: styles.section },
    h('h2', { className: styles.title, key: 'title' }, t('title')),
    h('p', { className: styles.intro, key: 'intro' }, t('intro')),

    // The switch owns the whole page, so it gets a bordered row rather than a
    // bare label line: the edge is what says the scope is everything below it.
    h(
      'div',
      { className: styles.preference, key: 'toggle' },
      h(
        'div',
        { className: styles.preferenceCopy },
        h('span', { className: styles.preferenceTitle }, t('exposeLabel')),
        h('p', { className: styles.preferenceHint }, exposed ? t('exposeOnHint') : t('modeOffHint')),
      ),
      h(
        'div',
        { className: styles.preferenceControl },
        h(Switch, {
          checked: exposed,
          label: t('exposeLabel'),
          disabled: !writable,
          onChange: (next) => setMode(next ? 'local' : 'off'),
        }),
      ),
    ),

    exposed
      ? h(
        'div',
        { className: styles.group, key: 'scope' },
        h(
          'div',
          { className: styles.groupHead },
          h('span', { className: styles.groupTitle }, t('modeLabel')),
          restartPending
            ? h(Tag, { tone: 'warning', children: t('pendingLabel') })
            : h(Tag, { tone: 'success', children: t('appliedLabel') }),
        ),
        h(
          'div',
          { className: styles.cards, role: 'radiogroup', 'aria-label': t('modeLabel') },
          ...OPEN_MODES.map((option) => h(
            'button',
            {
              key: option,
              type: 'button',
              role: 'radio',
              'aria-checked': mode === option,
              className: mode === option ? `${styles.card} ${styles.cardActive}` : styles.card,
              disabled: !writable,
              onClick: writable ? () => setMode(option) : undefined,
            },
            h(
              'span',
              { className: styles.cardHead },
              h('span', { className: styles.cardIcon }, h(ICON[option], { size: 16 })),
              h('span', { className: styles.cardName }, t(LABEL[option])),
            ),
            h('span', { className: styles.cardDesc }, t(HINT[option])),
          )),
        ),
      )
      : null,

    restartPending
      ? h(
        'div',
        { className: styles.callout, key: 'restart' },
        h('span', { className: styles.calloutIcon }, h(IconWarningOutline16, { size: 14 })),
        h(
          'div',
          { className: styles.calloutBody },
          h('span', { className: styles.calloutTitle }, t('restartTitle')),
          h(
            'p',
            { className: styles.calloutText },
            t('restartBody') + ' ',
            h('code', { className: styles.command }, 'dsh --profile web'),
          ),
        ),
      )
      : null,

    mode === 'tailscale'
      ? h(
        'div',
        { className: styles.field, key: 'address' },
        h('label', { className: styles.fieldLabel, htmlFor: 'remote-access-address' }, t('addressLabel')),
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
        h('label', { className: styles.fieldLabel, htmlFor: 'remote-access-extra' }, t('extraLabel')),
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
