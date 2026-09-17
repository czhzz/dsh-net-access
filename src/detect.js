/**
 * Tailnet address detection.
 *
 * Detection is interface-based, never literal-based: the plugin must work on
 * any machine running Tailscale, so no tailnet IP is ever hard-coded. The
 * Tailscale client names its adapter `Tailscale` on Windows, macOS, and Linux,
 * and always assigns it an address from the CGNAT range `100.64.0.0/10`.
 *
 * Both signals are consulted because neither is sufficient alone: a renamed
 * adapter still carries a CGNAT address, and a CGNAT-looking address on a
 * differently-named adapter is still the tailnet. An address matching either
 * signal is accepted; the interface name is preferred when several match.
 *
 * @module dsh-tailscale/detect
 */

/** The adapter name the Tailscale client uses across platforms. */
const TAILSCALE_INTERFACE = /^tailscale\d*$/iu;

/** Tailscale assigns every node an address inside the CGNAT range. */
const CGNAT_V4 = /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./u;

/**
 * Whether an interface name is the Tailscale adapter.
 *
 * @param name - the interface name reported by the operating system.
 * @returns true for the Tailscale adapter.
 */
export function isTailscaleInterface(name) {
	return TAILSCALE_INTERFACE.test(name);
}

/**
 * Whether an IPv4 address falls in the CGNAT range Tailscale assigns from.
 *
 * @param address - the IPv4 literal to classify.
 * @returns true when the address is inside `100.64.0.0/10`.
 */
export function isCgnatAddress(address) {
	return CGNAT_V4.test(address);
}

/**
 * Collect every usable IPv4 address from one interface entry.
 *
 * @param entries - one `os.networkInterfaces()` value, possibly undefined.
 * @returns the interface's non-internal IPv4 literals.
 */
function ipv4Addresses(entries) {
	if (entries === undefined) return [];
	const found = [];
	for (const entry of entries) {
		// `family` is 'IPv4' on every currently supported Node release; the
		// numeric form is accepted for forward compatibility.
		const isV4 = entry.family === "IPv4" || entry.family === 4;
		if (isV4 && !entry.internal) found.push(entry.address);
	}
	return found;
}

/**
 * Resolve the tailnet address from a network-interface snapshot.
 *
 * The snapshot is injected rather than read here so the resolution rule stays
 * testable without touching the host's real network.
 *
 * Interface-name matches win over CGNAT matches. That ordering matters on a
 * host that runs a second CGNAT-addressed overlay (another mesh VPN, or a
 * carrier-grade NAT uplink): the adapter Tailscale actually named is the
 * better answer than a range coincidence.
 *
 * @param interfaces - an `os.networkInterfaces()` snapshot.
 * @returns the resolved tailnet IPv4 literal, or undefined when absent.
 */
export function resolveTailnetAddress(interfaces) {
	const named = [];
	const cgnat = [];
	for (const [name, entries] of Object.entries(interfaces)) {
		for (const address of ipv4Addresses(entries)) {
			if (isTailscaleInterface(name)) named.push(address);
			else if (isCgnatAddress(address)) cgnat.push(address);
		}
	}
	return named[0] ?? cgnat[0];
}
