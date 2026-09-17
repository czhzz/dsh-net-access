window.__ModuleLoader__.load({ id: "dsh-net-access", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.js
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/Section.js
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/section-controller.js
var REMOTE_ACCESS_NS = "remote-access";
var OPEN_MODES = ["local", "tailscale", "all"];
function needsRestart(mode) {
  return mode === "off";
}
function crossesBind(from, to) {
  if (from === void 0 || to === void 0) return false;
  return needsRestart(from) !== needsRestart(to);
}
var RemoteAccessSectionController = class {
  /**
   * @param scope - the bound settings scope for the `remote-access` namespace.
   * @param ctx - the page plugin's context, used for the detected-address probe.
   */
  constructor(scope, ctx) {
    this.scope = scope;
    this.ctx = ctx;
  }
  /** The resolved posture, falling back to the safe default. */
  get mode() {
    return this.scope.getSnapshot().value?.mode ?? "local";
  }
  /** The configured tailnet address override, if any. */
  get address() {
    return this.scope.getSnapshot().value?.address ?? "";
  }
  /** Extra authorities the operator declared. */
  get extraTrustedHosts() {
    return this.scope.getSnapshot().value?.extraTrustedHosts ?? [];
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
    const snapshot = this.scope.getSnapshot();
    return snapshot.base?.mode ?? snapshot.value?.mode ?? "local";
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
    return this.scope.set("mode", next);
  }
  /**
   * Write the tailnet address override.
   * @param value - the address, or an empty string to return to detection.
   * @returns a promise resolving when the write settles.
   */
  setAddress(value) {
    return this.scope.set("address", value);
  }
  /**
   * Write the extra allowed authorities.
   * @param values - the authorities to accept.
   * @returns a promise resolving when the write settles.
   */
  setExtraTrustedHosts(values) {
    return this.scope.set("extraTrustedHosts", values);
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
      setExtraTrustedHosts: (values) => void this.setExtraTrustedHosts(values)
    };
  }
};

// src/client/Section.module.css
var css = ".N807zW_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.N807zW_title{margin:0;font-size:18px;font-weight:600;line-height:26px}.N807zW_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px;line-height:20px}.N807zW_preference{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-module-platform);border-radius:14px;justify-content:space-between;align-items:flex-start;gap:20px;padding:14px 16px;display:flex}.N807zW_preferenceCopy{gap:4px;min-width:0;display:grid}.N807zW_preferenceTitle{font-size:14px;font-weight:600;line-height:22px}.N807zW_preferenceHint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.N807zW_preferenceControl{flex:none;padding-top:1px}.N807zW_group{flex-direction:column;gap:10px;display:flex}.N807zW_groupHead{align-items:center;gap:8px;display:flex}.N807zW_groupTitle{font-size:13px;font-weight:600;line-height:20px}.N807zW_cards{grid-template-columns:repeat(auto-fill,minmax(196px,1fr));grid-auto-rows:1fr;gap:8px;display:grid}.N807zW_card{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border-radius:16px;flex-direction:column;align-items:flex-start;gap:6px;margin:0;padding:12px 14px;transition:border-color .16s,background .16s;display:flex}.N807zW_card:hover:not(.N807zW_cardActive){background:var(--dsw-alias-interactive-bg-hover)}.N807zW_cardActive{background:var(--dsw-alias-bg-module-platform);border-color:var(--dsw-static-neutral-bluish-400)}.N807zW_card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.N807zW_cardHead{align-items:center;gap:6px;min-width:0;display:flex}.N807zW_cardIcon{color:var(--dsw-alias-label-tertiary);flex:none;display:flex}.N807zW_cardActive .N807zW_cardIcon{color:var(--dsw-alias-label-primary)}.N807zW_cardName{font-size:14px;font-weight:600;line-height:22px}.N807zW_cardDesc{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.N807zW_callout{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);border-radius:12px;gap:10px;margin-top:8px;padding:12px 14px;display:flex}.N807zW_calloutIcon{color:var(--dsw-alias-state-warn-primary);flex:none;margin-top:3px;display:flex}.N807zW_calloutBody{gap:4px;min-width:0;display:grid}.N807zW_calloutTitle{font-size:13px;font-weight:600;line-height:20px}.N807zW_calloutText{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}.N807zW_command{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l4);user-select:all;border-radius:6px;padding:1px 6px;font-size:12px;line-height:18px}.N807zW_field{gap:6px;display:grid}.N807zW_fieldLabel{font-size:13px;font-weight:600;line-height:20px}.N807zW_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.N807zW_input{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);width:100%;color:var(--dsw-alias-label-primary);font:inherit;border-radius:10px;padding:8px 12px;font-size:13px;line-height:20px}.N807zW_input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.N807zW_input::placeholder{color:var(--dsw-alias-label-dimmed)}.N807zW_input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}.N807zW_textarea{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);width:100%;color:var(--dsw-alias-label-primary);font:inherit;resize:vertical;min-height:58px;font-family:var(--ds-font-family-code);border-radius:10px;padding:8px 12px;font-size:12.5px;line-height:20px}.N807zW_textarea:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.N807zW_textarea:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}";
var tagId = "dsh-net-access/Section.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-net-access";
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
var Section_default = { "callout": "N807zW_callout", "calloutBody": "N807zW_calloutBody", "calloutIcon": "N807zW_calloutIcon", "calloutText": "N807zW_calloutText", "calloutTitle": "N807zW_calloutTitle", "card": "N807zW_card", "cardActive": "N807zW_cardActive", "cardDesc": "N807zW_cardDesc", "cardHead": "N807zW_cardHead", "cardIcon": "N807zW_cardIcon", "cardName": "N807zW_cardName", "cards": "N807zW_cards", "command": "N807zW_command", "field": "N807zW_field", "fieldLabel": "N807zW_fieldLabel", "group": "N807zW_group", "groupHead": "N807zW_groupHead", "groupTitle": "N807zW_groupTitle", "hint": "N807zW_hint", "input": "N807zW_input", "intro": "N807zW_intro", "preference": "N807zW_preference", "preferenceControl": "N807zW_preferenceControl", "preferenceCopy": "N807zW_preferenceCopy", "preferenceHint": "N807zW_preferenceHint", "preferenceTitle": "N807zW_preferenceTitle", "section": "N807zW_section", "textarea": "N807zW_textarea", "title": "N807zW_title" };

// src/client/Section.js
var LABEL = {
  local: "modeLocal",
  tailscale: "modeTailscale",
  all: "modeAll"
};
var HINT = {
  local: "modeLocalHint",
  tailscale: "modeTailscaleHint",
  all: "modeAllHint"
};
var ICON = {
  local: import_dsh_client_ui_primitives.IconUserOutline16,
  tailscale: import_dsh_client_ui_primitives.IconLinkOutline16,
  all: import_dsh_client_ui_primitives.IconGlobeOutline14
};
function RemoteAccessSection(props) {
  const { t, useRemoteAccess, setMode, setAddress, setExtraTrustedHosts } = props;
  if (t === void 0 || useRemoteAccess === void 0 || setMode === void 0 || setAddress === void 0 || setExtraTrustedHosts === void 0) return null;
  const state = useRemoteAccess((snapshot) => snapshot);
  const mode = state?.value?.mode ?? "local";
  const applied = state?.base?.mode ?? mode;
  const writable = state?.writable !== false;
  if (state?.status === "unavailable") {
    return (0, import_react.createElement)(
      "div",
      { className: Section_default.section },
      (0, import_react.createElement)("p", { className: Section_default.intro }, t("unavailable"))
    );
  }
  const restartPending = crossesBind(applied, mode);
  const exposed = mode !== "off";
  return (0, import_react.createElement)(
    "div",
    { className: Section_default.section },
    (0, import_react.createElement)("h2", { className: Section_default.title, key: "title" }, t("title")),
    (0, import_react.createElement)("p", { className: Section_default.intro, key: "intro" }, t("intro")),
    // The switch owns the whole page, so it gets a bordered row rather than a
    // bare label line: the edge is what says the scope is everything below it.
    (0, import_react.createElement)(
      "div",
      { className: Section_default.preference, key: "toggle" },
      (0, import_react.createElement)(
        "div",
        { className: Section_default.preferenceCopy },
        (0, import_react.createElement)("span", { className: Section_default.preferenceTitle }, t("exposeLabel")),
        (0, import_react.createElement)("p", { className: Section_default.preferenceHint }, exposed ? t("exposeOnHint") : t("modeOffHint"))
      ),
      (0, import_react.createElement)(
        "div",
        { className: Section_default.preferenceControl },
        (0, import_react.createElement)(import_dsh_client_ui_primitives.Switch, {
          checked: exposed,
          label: t("exposeLabel"),
          disabled: !writable,
          onChange: (next) => setMode(next ? "local" : "off")
        })
      )
    ),
    exposed ? (0, import_react.createElement)(
      "div",
      { className: Section_default.group, key: "scope" },
      (0, import_react.createElement)(
        "div",
        { className: Section_default.groupHead },
        (0, import_react.createElement)("span", { className: Section_default.groupTitle }, t("modeLabel")),
        restartPending ? (0, import_react.createElement)(import_dsh_client_ui_primitives.Tag, { tone: "warning", children: t("pendingLabel") }) : (0, import_react.createElement)(import_dsh_client_ui_primitives.Tag, { tone: "success", children: t("appliedLabel") })
      ),
      (0, import_react.createElement)(
        "div",
        { className: Section_default.cards, role: "radiogroup", "aria-label": t("modeLabel") },
        ...OPEN_MODES.map((option) => (0, import_react.createElement)(
          "button",
          {
            key: option,
            type: "button",
            role: "radio",
            "aria-checked": mode === option,
            className: mode === option ? `${Section_default.card} ${Section_default.cardActive}` : Section_default.card,
            disabled: !writable,
            onClick: writable ? () => setMode(option) : void 0
          },
          (0, import_react.createElement)(
            "span",
            { className: Section_default.cardHead },
            (0, import_react.createElement)("span", { className: Section_default.cardIcon }, (0, import_react.createElement)(ICON[option], { size: 16 })),
            (0, import_react.createElement)("span", { className: Section_default.cardName }, t(LABEL[option]))
          ),
          (0, import_react.createElement)("span", { className: Section_default.cardDesc }, t(HINT[option]))
        ))
      )
    ) : null,
    restartPending ? (0, import_react.createElement)(
      "div",
      { className: Section_default.callout, key: "restart" },
      (0, import_react.createElement)("span", { className: Section_default.calloutIcon }, (0, import_react.createElement)(import_dsh_client_ui_primitives.IconWarningOutline16, { size: 14 })),
      (0, import_react.createElement)(
        "div",
        { className: Section_default.calloutBody },
        (0, import_react.createElement)("span", { className: Section_default.calloutTitle }, t("restartTitle")),
        (0, import_react.createElement)(
          "p",
          { className: Section_default.calloutText },
          t("restartBody") + " ",
          (0, import_react.createElement)("code", { className: Section_default.command }, "dsh --profile web")
        )
      )
    ) : null,
    mode === "tailscale" ? (0, import_react.createElement)(
      "div",
      { className: Section_default.field, key: "address" },
      (0, import_react.createElement)("label", { className: Section_default.fieldLabel, htmlFor: "remote-access-address" }, t("addressLabel")),
      (0, import_react.createElement)("input", {
        id: "remote-access-address",
        className: Section_default.input,
        type: "text",
        value: state?.value?.address ?? "",
        placeholder: t("addressPlaceholder"),
        disabled: !writable,
        onChange: (event) => setAddress(event.target.value)
      }),
      (0, import_react.createElement)("p", { className: Section_default.hint }, t("addressHint"))
    ) : null,
    // The allow-list only qualifies an open port: with the port closed nothing
    // can reach it, so the field would describe a fence with no gate.
    exposed ? (0, import_react.createElement)(
      "div",
      { className: Section_default.field, key: "extra" },
      (0, import_react.createElement)("label", { className: Section_default.fieldLabel, htmlFor: "remote-access-extra" }, t("extraLabel")),
      (0, import_react.createElement)("textarea", {
        id: "remote-access-extra",
        className: Section_default.textarea,
        rows: 2,
        disabled: !writable,
        value: (state?.value?.extraTrustedHosts ?? []).join("\n"),
        onChange: (event) => setExtraTrustedHosts(
          event.target.value.split("\n").map((line) => line.trim()).filter((line) => line !== "")
        )
      }),
      (0, import_react.createElement)("p", { className: Section_default.hint }, t("extraHint"))
    ) : null
  );
}

// src/client/locales.js
var en = {
  nav: "Remote Access",
  title: "Remote Access",
  intro: "Let other devices on your network reach this GUI.",
  exposeLabel: "Allow remote access",
  exposeOnHint: "The port is open on every interface. Choose below who may connect.",
  modeLabel: "Who may connect",
  modeLocal: "This machine only",
  modeLocalHint: "The port is open, but only this machine may use it. Other devices are refused.",
  modeTailscale: "Tailscale",
  modeTailscaleHint: "Only devices on your tailnet. Every other network is refused.",
  modeAll: "Any network",
  modeAllHint: "Any device on any network this machine is on, including VMware, WSL, and the LAN.",
  modeOffHint: "Closed. The port is closed to other devices \u2014 they cannot even connect to it.",
  addressLabel: "Tailnet address",
  addressPlaceholder: "Detect automatically",
  addressHint: "Leave empty to detect the Tailscale adapter.",
  extraLabel: "Extra allowed hosts",
  extraHint: "Additional host[:port] authorities to accept, one per line.",
  restartTitle: "Restart required",
  restartBody: "The port is opened when the server starts, so this takes effect after a restart.",
  appliedLabel: "Active",
  pendingLabel: "After restart",
  unavailable: "Settings are unavailable in this deployment."
};
var zh = {
  nav: "\u8FDC\u7A0B\u8BBF\u95EE",
  title: "\u8FDC\u7A0B\u8BBF\u95EE",
  intro: "\u5141\u8BB8\u7F51\u7EDC\u4E2D\u7684\u5176\u4ED6\u8BBE\u5907\u8BBF\u95EE\u672C GUI\u3002",
  exposeLabel: "\u5141\u8BB8\u8FDC\u7A0B\u8BBF\u95EE",
  exposeOnHint: "\u7AEF\u53E3\u5DF2\u5728\u6240\u6709\u7F51\u5361\u4E0A\u5F00\u653E\u3002\u5728\u4E0B\u65B9\u9009\u62E9\u5141\u8BB8\u8C01\u8FDE\u63A5\u3002",
  modeLabel: "\u5141\u8BB8\u8C01\u8FDE\u63A5",
  modeLocal: "\u4EC5\u672C\u673A",
  modeLocalHint: "\u7AEF\u53E3\u5DF2\u5F00\u653E\uFF0C\u4F46\u53EA\u6709\u672C\u673A\u53EF\u4EE5\u4F7F\u7528\u3002\u5176\u4ED6\u8BBE\u5907\u4E00\u5F8B\u62D2\u7EDD\u3002",
  modeTailscale: "Tailscale",
  modeTailscaleHint: "\u4EC5 tailnet \u5185\u7684\u8BBE\u5907\u3002\u5176\u4ED6\u7F51\u7EDC\u4E00\u5F8B\u62D2\u7EDD\u3002",
  modeAll: "\u4EFB\u610F\u7F51\u7EDC",
  modeAllHint: "\u672C\u673A\u6240\u5728\u4EFB\u610F\u7F51\u7EDC\u4E0A\u7684\u8BBE\u5907\uFF0C\u5305\u62EC VMware\u3001WSL \u548C\u5C40\u57DF\u7F51\u3002",
  modeOffHint: "\u5DF2\u5173\u95ED\u3002\u7AEF\u53E3\u5BF9\u5176\u4ED6\u8BBE\u5907\u5173\u95ED\uFF0C\u5B83\u4EEC\u751A\u81F3\u65E0\u6CD5\u5EFA\u7ACB\u8FDE\u63A5\u3002",
  addressLabel: "Tailnet \u5730\u5740",
  addressPlaceholder: "\u81EA\u52A8\u63A2\u6D4B",
  addressHint: "\u7559\u7A7A\u5219\u81EA\u52A8\u63A2\u6D4B Tailscale \u7F51\u5361\u3002",
  extraLabel: "\u989D\u5916\u5141\u8BB8\u7684\u4E3B\u673A",
  extraHint: "\u989D\u5916\u63A5\u53D7\u7684 host[:port] \u6388\u6743\uFF0C\u6BCF\u884C\u4E00\u4E2A\u3002",
  restartTitle: "\u9700\u8981\u91CD\u542F",
  restartBody: "\u7AEF\u53E3\u5728\u670D\u52A1\u5668\u542F\u52A8\u65F6\u5F00\u653E\uFF0C\u56E0\u6B64\u5C06\u5728\u91CD\u542F\u540E\u751F\u6548\u3002",
  appliedLabel: "\u5DF2\u751F\u6548",
  pendingLabel: "\u91CD\u542F\u540E\u751F\u6548",
  unavailable: "\u5F53\u524D\u90E8\u7F72\u4E0D\u652F\u6301\u8BBE\u7F6E\u3002"
};

// src/client/index.js
var NS = "settings.remote-access";
var inject = ["slots", "locale", "settingsScope"];
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "remote-access: copy dictionaries");
  const scope = ctx.settingsScope.bind({
    namespace: REMOTE_ACCESS_NS,
    decode: (section) => typeof section === "object" && section !== null ? section : void 0
  });
  const controller = new RemoteAccessSectionController(scope, ctx);
  const t = ctx.locale.bind(NS);
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "remote-access",
    order: 30,
    label: () => t("nav"),
    inject: () => ({ ...controller.inject(), t })
  }, RemoteAccessSection));
}

return module.exports; } });
