// Plain-language privacy notice a child can understand.
import { h } from "../ui/h.js";
import { iconButton } from "../ui/components.js";
import { t } from "../i18n.js";

export function privacyScreen(ctx) {
  return h(
    "main",
    { class: "stack" },
    h("div", { class: "topbar" }, iconButton("back", t("label.back"), () => history.length > 1 ? history.back() : ctx.go("welcome")), h("h1", { class: "screen-title" }, t("privacy.title"))),
    h("ul", { class: "card privacy" }, ["body1", "body2", "body3", "body4", "body5", "body6"].map((k) => h("li", null, t("privacy." + k)))),
    h("p", { class: "muted-note" }, t("privacy.owner"))
  );
}
