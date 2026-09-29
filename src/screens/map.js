// Mission map (home): 8 tiles, unlocked in sequence.
import { h, svg } from "../ui/h.js";
import { ICONS } from "../ui/icons.js";
import { counters, guide, levelBar, iconButton, targetDisplay, tilt } from "../ui/components.js";
import { t, tx } from "../i18n.js";

export function mapScreen(ctx) {
  const { game, content } = ctx;
  const state = game.state;
  const missions = [...content.missions.missions].sort((a, b) => a.order - b.order);
  const n = state.completed.length;

  const tiles = missions.map((m, i) => {
    const target = content.targets.targets.find((x) => x.missionId === m.id);
    const d = targetDisplay(target);
    const unlocked = game.isUnlocked(m.id);
    const done = state.completed.includes(m.id);
    const playable = unlocked && !!content.play[m.id];
    const prev = i > 0 ? tx(missions[i - 1].name) : "";
    let flag = null;
    if (done) flag = h("span", { class: "tile-flag done" }, t("map.done"));
    else if (playable) flag = h("span", { class: "tile-flag play" }, t("map.play"));
    else if (unlocked) flag = h("span", { class: "tile-flag soon" }, t("map.soon"));

    const status = done ? t("map.done") : playable ? t("map.play") : unlocked ? t("map.soon") : t("map.locked", { prev });
    return h(
      "button",
      {
        type: "button",
        class: "tile" + (unlocked ? "" : " locked"),
        style: { background: m.colour, transform: tilt(i) },
        "aria-label": `${tx(m.name)}. ${t("label.zambiaGoal")}: ${d.big} ${d.small}. ${status}`,
        "aria-disabled": playable ? null : "true",
        onclick: () => (playable ? ctx.go("intro", m.id) : ctx.toast(status)),
      },
      flag,
      h("span", { class: "tile-top" }, h("span", { class: "tile-num" }, d.big), h("span", { class: "tile-icon" }, svg(ICONS[unlocked ? m.icon : "lock"]))),
      h("span", { class: "tile-bottom" }, h("span", { class: "tile-unit" }, d.small), h("span", { class: "tile-name" }, tx(m.name)))
    );
  });

  return h(
    "main",
    { class: "stack" },
    h("div", { class: "topbar" }, counters(state, missions.length), iconButton("user", t("label.profile"), () => ctx.go("profile"))),
    guide(n ? t("map.helloDone", { n }) : t("map.hello")),
    h("div", { class: "tiles" }, tiles),
    levelBar(state.level)
  );
}
