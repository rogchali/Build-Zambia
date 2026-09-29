// Mission complete: celebration, giant reward numbers, badge, level.
import { h, svg } from "../ui/h.js";
import { ICONS } from "../ui/icons.js";
import { button, confetti, guide, stat } from "../ui/components.js";
import { t, tx, fmt } from "../i18n.js";

export function completeScreen(ctx, missionId) {
  const r = ctx.lastResult;
  if (!r || r.missionId !== missionId) return ctx.go("map");
  const { content } = ctx;
  const m = content.missions.missions.find((x) => x.id === missionId);
  const play = content.play[missionId];
  const badge = content.badges.badges.find((b) => b.missionId === missionId);
  const levelUp = r.levelAfter.n > r.levelBefore.n;
  const allDone = r.newBadges.includes("i-built-zambia");

  let jimmy;
  if (r.perfect) jimmy = t("done.perfect");
  else if (r.produced < r.goal) jimmy = t("done.goalMissed", { n: fmt(r.produced), goal: fmt(r.goal) });
  else jimmy = t("done.notPerfect");

  const reward = (value, label, bg) =>
    h("div", { class: "reward", style: { background: bg } }, h("span", { class: "reward-num" }, value), h("span", { class: "reward-label" }, label));

  return h(
    "main",
    { class: "stack complete" },
    confetti(),
    h("h1", { class: "screen-title big" }, t("done.title")),
    stat({ kind: "personal", value: r.produced, unit: tx(r.unit) }),
    h(
      "div",
      { class: "rewards" },
      reward("+" + fmt(r.missionPoints), t("done.missionPoints"), "#8FD6F5"),
      reward("+" + fmt(r.coinsEarned), t("done.coins"), "#FFD23F"),
      r.bonusPoints ? reward("+" + fmt(r.bonusPoints), t("done.bonusPoints"), "#C9A7F5") : null
    ),
    r.newBadges.includes(missionId)
      ? h("div", { class: "card badge-won" }, h("span", { class: "badge-big", style: { background: m.colour } }, svg(ICONS[m.icon])), h("span", null, h("span", { class: "stat-label" }, t("done.badge")), h("span", { class: "option-title" }, tx(badge.name))))
      : null,
    allDone ? h("div", { class: "card badge-won" }, h("span", { class: "badge-big", style: { background: "#FF9F1C" } }, svg(ICONS.badge)), h("span", { class: "option-title" }, "I BUILT ZAMBIA")) : null,
    levelUp ? h("p", { class: "levelup" }, t("done.levelUp", { name: tx(r.levelAfter.name) })) : null,
    guide(jimmy),
    h("div", { class: "card lesson" }, h("span", { class: "stat-label" }, t("done.lessonLabel")), h("p", null, tx(play.lesson))),
    button(t("done.toMap"), () => ctx.go("map"))
  );
}
