import { h } from "../ui/h.js";
import { button, letterBlocks, guide, stat } from "../ui/components.js";
import { t, tx } from "../i18n.js";

// Phase 0: the welcome screen shell. Profile setup and the mission map
// arrive in Phase 1 — the button just shows a placeholder until then.
export function welcomeScreen(ctx) {
  const maizeTarget = ctx.content.targets.targets.find((x) => x.id === "maize");
  const maize = ctx.content.missions.missions.find((m) => m.id === "maize");
  return h(
    "main",
    { class: "stack" },
    letterBlocks("BUILD"),
    letterBlocks("ZAMBIA", ["#3FAE4A", "#FF9F1C", "#62C3F0"]),
    h("h2", { style: { textAlign: "center", fontSize: "24px" } }, t("app.taglineShort")),
    guide(t("welcome.hello")),
    h(
      "div",
      { class: "row2" },
      stat({ kind: "national_goal", value: maizeTarget.value / 1e6 + "M", unit: maizeTarget.unit + " · " + tx(maize.name), source: { name: maizeTarget.sourceName, deadlineYear: maizeTarget.deadlineYear } }),
      stat({ kind: "personal", value: maize.personalGoal.amount, unit: tx(maize.personalGoal.unit) })
    ),
    button(t("welcome.cta"), () => ctx.toast(t("dev.phase0"))),
    h("p", { class: "muted-note" }, t("dev.phase0"))
  );
}
