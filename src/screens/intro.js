// Mission intro: "Zambia's Goal" beside "Your Mission".
import { h } from "../ui/h.js";
import { button, guide, iconButton, letterBlocks, stat, targetDisplay } from "../ui/components.js";
import { t, tx } from "../i18n.js";

export async function introScreen(ctx, missionId) {
  const { content, game } = ctx;
  const m = content.missions.missions.find((x) => x.id === missionId);
  const play = content.play[missionId];
  if (!m || !play || !game.isUnlocked(missionId)) return ctx.go("map");
  const target = content.targets.targets.find((x) => x.missionId === missionId);
  const d = targetDisplay(target);
  const replay = game.state.completed.includes(missionId);
  const inProgress = !!(await game.store.get("run:" + missionId));

  return h(
    "main",
    { class: "stack" },
    h("div", { class: "topbar" }, iconButton("back", t("label.back"), () => ctx.go("map")), letterBlocks(tx(m.name).toUpperCase(), [m.colour, "#FFFFFF"], true)),
    h(
      "div",
      { class: "row2" },
      stat({ kind: "national_goal", value: d.big, unit: d.small, source: { name: target.sourceName, deadlineYear: target.deadlineYear } }),
      stat({ kind: "personal", value: play.goal, unit: tx(play.unit) })
    ),
    guide(tx(play.intro)),
    h("div", { class: "card lesson" }, h("span", { class: "stat-label" }, t("intro.lesson")), h("p", null, tx(play.lesson))),
    replay ? h("p", { class: "muted-note" }, t("intro.replay")) : null,
    h("p", { class: "muted-note" }, t("virtual.note")),
    button(inProgress ? t("intro.continue") : t("intro.start"), () => ctx.go("play", missionId))
  );
}
