// Shared sticker-style building blocks.

import { h, svg } from "./h.js";
import { ICONS, JIMMY } from "./icons.js";
import { t, fmt } from "../i18n.js";

const TILTS = [-2, 1.5, -1.5, 2, -3, 4];
export const tilt = (i, scale = 1) => `rotate(${TILTS[i % TILTS.length] * scale}deg)`;

export function button(label, onclick, { variant = "go", icon, disabled } = {}) {
  return h("button", { type: "button", class: "btn btn-" + variant, onclick, disabled }, label, icon ? svg(ICONS[icon]) : null);
}

export function iconButton(icon, label, onclick) {
  return h("button", { type: "button", class: "icon-btn", "aria-label": label, onclick }, svg(ICONS[icon]));
}

export function letterBlocks(word, colours = ["#FFD23F", "#FFFFFF"], small = false) {
  return h(
    "div",
    { class: "letters" + (small ? " letters-sm" : ""), "aria-label": word, role: "img" },
    [...word].map((ch, i) =>
      ch === " "
        ? h("span", { class: "letter-gap" })
        : h("span", { class: "letter", "aria-hidden": "true", style: { background: colours[i % colours.length], transform: tilt(i, 1.5) } }, ch)
    )
  );
}

export function guide(text, { live = false } = {}) {
  return h("div", { class: "guide" }, h("span", { class: "guide-face" }, svg(JIMMY)), h("p", { class: "bubble", "aria-live": live ? "polite" : null }, text));
}

export function counter(icon, value, label, bg) {
  return h("div", { class: "counter", style: { background: bg }, "aria-label": label + ": " + value }, svg(ICONS[icon]), h("span", { class: "num" }, value));
}

// Coins · total Build Points · badges — the map's header row.
export function counters(state, missionCount) {
  const missionBadges = state.badges.filter((b) => b !== "i-built-zambia").length;
  return h(
    "div",
    { class: "counters" },
    counter("coin", fmt(state.coins), t("label.coins"), "#FFD23F"),
    counter("star", fmt(state.totalPoints), t("label.points"), "#8FD6F5"),
    counter("badge", missionBadges + "/" + missionCount, t("label.badges"), "#9BD86B")
  );
}

export function coinPill(coins) {
  return h("div", { class: "pill", "aria-label": t("label.coins") + ": " + coins }, svg(ICONS.coin), h("span", { class: "num" }, fmt(coins)));
}

export function levelBar(level) {
  return h(
    "div",
    { class: "levelbar card", "aria-label": t("label.level") + " " + level.n },
    h("span", { class: "levelbar-label" }, t("label.level")),
    h("span", { class: "levelbar-boxes" }, [1, 2, 3, 4, 5].map((n) => h("span", { class: "lv" + (n <= level.n ? " on" : "") }, n)))
  );
}

// Every number shown to a player goes through stat(), so it always carries
// the right label and can never pass virtual production off as real.
//   kind: "national_goal" | "personal" | "community_virtual" | "official"
const KINDS = {
  national_goal: { label: () => t("label.zambiaGoal"), cls: "stat-goal" },
  personal: { label: () => t("label.personal"), cls: "stat-personal" },
  community_virtual: { label: () => t("label.community"), cls: "stat-community" },
  official: { label: () => t("label.official"), cls: "stat-official" },
};

function checkKind(kind, unit, source) {
  if (!KINDS[kind]) throw new Error("stat(): unknown kind " + kind);
  if ((kind === "personal" || kind === "community_virtual") && !/virtual/i.test(unit)) {
    throw new Error("stat(): " + kind + " production must be labelled virtual (got unit '" + unit + "')");
  }
  if (kind === "official" && !(source && source.name && source.date)) {
    throw new Error("stat(): an official statistic needs a source name and date");
  }
}

export function stat({ kind, value, unit, source }) {
  checkKind(kind, unit, source);
  const k = KINDS[kind];
  let sourceLine = null;
  if (kind === "national_goal") {
    sourceLine = source && source.name ? source.name : t("label.sourcePending");
    if (source && source.deadlineYear) sourceLine = t("label.by") + " " + source.deadlineYear + " · " + sourceLine;
  } else if (kind === "official") {
    sourceLine = source.name + " · " + source.date;
  }
  return h(
    "div",
    { class: "stat " + k.cls },
    h("span", { class: "stat-label" }, k.label()),
    h("span", { class: "stat-value" }, typeof value === "number" ? fmt(value) : value),
    h("span", { class: "stat-unit" }, unit),
    sourceLine ? h("span", { class: "stat-source" }, sourceLine) : null
  );
}

// Progress meter toward the player's personal (virtual) goal.
export function meter({ value, goal, unit, label }) {
  checkKind("personal", unit);
  const pct = Math.max(0, Math.min(100, Math.round((value / goal) * 100)));
  return h(
    "div",
    { class: "meter", role: "img", "aria-label": `${label}: ${value} of ${goal} ${unit}` },
    h("div", { class: "meter-top" }, h("span", { class: "stat-label" }, t("label.personal")), h("span", { class: "meter-num" }, fmt(value) + " / " + fmt(goal))),
    h("div", { class: "meter-track" }, h("span", { class: "meter-fill" + (value >= goal ? " full" : ""), style: { width: pct + "%" } })),
    h("span", { class: "stat-unit" }, unit)
  );
}

// Big numeral + small unit for a national target, e.g. 10 / "million tonnes",
// 10K / "megawatts", $1 / "billion exports" — read from targets.json, never typed in.
export function targetDisplay(target) {
  const v = target.value;
  let n, scale = "";
  if (v >= 1e9) { n = v / 1e9; scale = "billion"; }
  else if (v >= 1e6) { n = v / 1e6; scale = "million"; }
  else if (v >= 1e3) { n = v / 1e3 + "K"; }
  else n = v;
  let unit = target.unit;
  if (/^US\$/.test(unit)) { n = "$" + n; unit = unit.replace(/^US\$\s*(of\s*)?/, ""); }
  return { big: String(n), small: (scale ? scale + " " : "") + unit };
}

export function confetti() {
  const colours = ["#FFD23F", "#FF9F1C", "#3FAE4A", "#62C3F0", "#E5383B", "#C9A7F5"];
  return h(
    "div",
    { class: "confetti", "aria-hidden": "true" },
    Array.from({ length: 36 }, (_, i) =>
      h("i", { style: { left: ((i * 37) % 100) + "%", background: colours[i % colours.length], animationDelay: ((i * 83) % 900) + "ms", transform: `rotate(${(i * 47) % 360}deg)` } })
    )
  );
}
