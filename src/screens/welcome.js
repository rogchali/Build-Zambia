import { h } from "../ui/h.js";
import { button, letterBlocks, guide } from "../ui/components.js";
import { t } from "../i18n.js";

export function welcomeScreen(ctx) {
  const p = ctx.game.player;
  return h(
    "main",
    { class: "stack welcome" },
    letterBlocks("BUILD"),
    letterBlocks("ZAMBIA", ["#3FAE4A", "#FF9F1C", "#62C3F0"]),
    h("h1", { class: "tagline" }, t("app.taglineShort")),
    guide(p ? t("welcome.back", { name: p.nickname }) : t("welcome.hello")),
    button(t("welcome.cta"), () => ctx.go(p ? "map" : "setup")),
    h("button", { type: "button", class: "link", onclick: () => ctx.go("privacy") }, t("welcome.privacy"))
  );
}
