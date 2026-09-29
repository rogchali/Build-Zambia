// Profile setup: nickname, age band, province — nothing else, ever.
import { h } from "../ui/h.js";
import { button, guide } from "../ui/components.js";
import { t, tx } from "../i18n.js";
import { checkNickname } from "../engine/nickname.js";
import { newId } from "../engine/ledger.js";

export function setupScreen(ctx) {
  const { profile, blocklist } = ctx.content;
  const pick = { nickname: "", ageBand: null, province: null };

  const msg = h("p", { class: "field-msg", id: "nick-msg", "aria-live": "polite" }, t("setup.nicknameHint"));
  const input = h("input", {
    id: "nick", type: "text", maxlength: "16", autocomplete: "off", autocapitalize: "off", spellcheck: "false",
    "aria-describedby": "nick-msg",
    oninput: (e) => {
      pick.nickname = e.target.value.trim();
      const r = checkNickname(pick.nickname, blocklist);
      msg.textContent = pick.nickname ? (r.ok ? t("nickname.ok") : t(r.reason)) : t("setup.nicknameHint");
      msg.className = "field-msg" + (pick.nickname ? (r.ok ? " ok" : " bad") : "");
      refresh();
    },
  });

  function choiceGroup(name, items, key, cols) {
    const group = h("div", { class: "choices cols-" + cols, role: "radiogroup", "aria-label": name });
    items.forEach((it) => {
      const b = h("button", {
        type: "button", class: "choice", role: "radio", "aria-checked": "false",
        onclick: () => {
          pick[key] = it.id;
          group.querySelectorAll(".choice").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
          refresh();
        },
      }, tx(it.label));
      group.append(b);
    });
    return group;
  }

  const go = button(t("setup.cta"), async () => {
    if (!ready()) return ctx.toast(t("setup.missing"));
    await ctx.game.createPlayer({ nickname: pick.nickname, ageBand: pick.ageBand, province: pick.province }, newId());
    ctx.go("map");
  });

  const ready = () => checkNickname(pick.nickname, blocklist).ok && pick.ageBand && pick.province;
  function refresh() { go.classList.toggle("btn-dim", !ready()); }
  refresh();

  return h(
    "main",
    { class: "stack" },
    h("h1", { class: "screen-title" }, t("setup.title")),
    guide(t("setup.hello")),
    h("div", { class: "card stack-sm" }, h("label", { for: "nick", class: "field-label" }, t("setup.nickname")), input, msg),
    h("div", { class: "card stack-sm" }, h("h2", { class: "field-label" }, t("setup.age")), choiceGroup(t("setup.age"), profile.ageBands, "ageBand", 3)),
    h("div", { class: "card stack-sm" }, h("h2", { class: "field-label" }, t("setup.province")), choiceGroup(t("setup.province"), profile.provinces, "province", 2)),
    go,
    h("button", { type: "button", class: "link", onclick: () => ctx.go("privacy") }, t("welcome.privacy"))
  );
}
