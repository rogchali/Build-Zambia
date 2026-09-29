// Profile: nickname, level, Mission/Bonus Points split, badges, province.
import { h, svg } from "../ui/h.js";
import { ICONS } from "../ui/icons.js";
import { button, coinPill, iconButton, levelBar, stat } from "../ui/components.js";
import { t, tx, fmt } from "../i18n.js";

export function profileScreen(ctx) {
  const { game, content } = ctx;
  const p = game.player;
  if (!p) return ctx.go("welcome");
  const s = game.state;
  const province = content.profile.provinces.find((x) => x.id === p.province);
  const missions = [...content.missions.missions].sort((a, b) => a.order - b.order);

  const row = (label, value) => h("div", { class: "points-row" }, h("span", null, label), h("span", { class: "num" }, value));

  const badges = content.badges.badges.map((b) => {
    const m = missions.find((x) => x.id === b.missionId);
    const won = s.badges.includes(b.id);
    return h(
      "div",
      { class: "badge-tile" + (won ? " won" : ""), style: { background: won ? (m ? m.colour : "#FF9F1C") : null }, "aria-label": tx(b.name) + (won ? "" : " — not yet") },
      svg(ICONS[m ? m.icon : "badge"]),
      h("span", null, m ? tx(m.name) : tx(b.name))
    );
  });

  const produced = Object.entries(s.production).map(([id, amount]) => {
    const play = content.play[id];
    return stat({ kind: "personal", value: amount, unit: play ? tx(play.unit) + " · " + tx(missions.find((m) => m.id === id).name) : "virtual" });
  });

  return h(
    "main",
    { class: "stack" },
    h("div", { class: "topbar" }, iconButton("back", t("label.back"), () => ctx.go("map")), h("h1", { class: "screen-title" }, t("profile.title")), coinPill(s.coins)),
    h("div", { class: "card who" }, h("span", { class: "who-name" }, p.nickname), h("span", null, tx(s.level.name) + " · " + (province ? tx(province.label) : ""))),
    levelBar(s.level),
    h(
      "div",
      { class: "card" },
      row(t("profile.missionPoints"), fmt(s.missionPoints) + " / " + fmt(s.missionPointsMax)),
      row(t("profile.bonusPoints"), fmt(s.bonusPoints)),
      row(t("profile.total"), fmt(s.totalPoints))
    ),
    h("h2", { class: "field-label" }, t("label.badges")),
    h("div", { class: "badge-grid" }, badges),
    h("h2", { class: "field-label" }, t("profile.production")),
    produced.length ? h("div", { class: "stack-sm" }, produced) : h("p", { class: "muted-note" }, t("profile.nothingYet")),
    h("p", { class: "muted-note" }, t("virtual.note")),
    h("button", { type: "button", class: "link", onclick: () => ctx.go("privacy") }, t("welcome.privacy")),
    button(t("profile.delete"), async () => {
      if (!confirm(t("profile.deleteConfirm"))) return;
      await game.reset();
      ctx.go("welcome");
    }, { variant: "alt" })
  );
}
