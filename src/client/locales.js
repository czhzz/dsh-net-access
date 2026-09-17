/**
 * Copy dictionaries for the Remote Access settings page.
 *
 * English is the key-set source of truth; every other locale mirrors it so a
 * missing translation is a compile error rather than a blank label.
 */

/** English copy. */
export const en = {
  nav: 'Remote Access',
  title: 'Remote Access',
  intro: 'Let other devices on your network reach this GUI.',

  exposeLabel: 'Allow remote access',
  exposeOnHint: 'The port is open on every interface. Choose below who may connect.',

  modeLabel: 'Who may connect',
  modeLocal: 'This machine only',
  modeLocalHint: 'The port is open, but only this machine may use it. Other devices are refused.',
  modeTailscale: 'Tailscale',
  modeTailscaleHint: 'Only devices on your tailnet. Every other network is refused.',
  modeAll: 'Any network',
  modeAllHint: 'Any device on any network this machine is on, including VMware, WSL, and the LAN.',

  modeOffHint: 'Closed. The port is closed to other devices — they cannot even connect to it.',

  addressLabel: 'Tailnet address',
  addressPlaceholder: 'Detect automatically',
  addressHint: 'Leave empty to detect the Tailscale adapter.',
  extraLabel: 'Extra allowed hosts',
  extraHint: 'Additional host[:port] authorities to accept, one per line.',

  restartTitle: 'Restart required',
  restartBody: 'The port is opened when the server starts, so this takes effect after a restart.',
  appliedLabel: 'Active',
  pendingLabel: 'After restart',
  unavailable: 'Settings are unavailable in this deployment.',
}

/** Chinese copy; the key set mirrors {@link en}. */
export const zh = {
  nav: '远程访问',
  title: '远程访问',
  intro: '允许网络中的其他设备访问本 GUI。',

  exposeLabel: '允许远程访问',
  exposeOnHint: '端口已在所有网卡上开放。在下方选择允许谁连接。',

  modeLabel: '允许谁连接',
  modeLocal: '仅本机',
  modeLocalHint: '端口已开放，但只有本机可以使用。其他设备一律拒绝。',
  modeTailscale: 'Tailscale',
  modeTailscaleHint: '仅 tailnet 内的设备。其他网络一律拒绝。',
  modeAll: '任意网络',
  modeAllHint: '本机所在任意网络上的设备，包括 VMware、WSL 和局域网。',

  modeOffHint: '已关闭。端口对其他设备关闭，它们甚至无法建立连接。',

  addressLabel: 'Tailnet 地址',
  addressPlaceholder: '自动探测',
  addressHint: '留空则自动探测 Tailscale 网卡。',
  extraLabel: '额外允许的主机',
  extraHint: '额外接受的 host[:port] 授权，每行一个。',

  restartTitle: '需要重启',
  restartBody: '端口在服务器启动时开放，因此将在重启后生效。',
  appliedLabel: '已生效',
  pendingLabel: '重启后生效',
  unavailable: '当前部署不支持设置。',
}
