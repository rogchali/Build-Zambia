// Shared sticker-style building blocks.

import { h, svg } from "./h.js";
import { ICONS, JIMMY } from "./icons.js";
import { t, fmt } from "../i18n.js";

const TILTS = [-2, 1.5, -1.5, 2, -3, 4];

export function button(label, onclick, { variant = "go", icon } = {}) {
  return h("button", { type: "button", class: "btn btn-" + variant, onclick }, label, icon ? svg(ICONS[icon]) : null);
}

export function letterBlocks(word, colours = ["#FFD23F", "#FFFFFF"]) {
  return h(
    "div",
    { class: "letters", "aria-label": word, role: "img" },
    [...word].map((ch, i) =>
      ch === " "
        ? h("span", { class: "letter-gap" })
        : h("span", { class: "letter", "aria-hidden": "true", style: { background: colours[i % colours.length], transform: `rotate(${TILTS[i % TILTS.length] * 1.5}deg)` } }, ch)
    )
  );
}

export function guide(text) {
  return h("div", { class: "guide" }, h("span", { class: "guide-face" }, svg(JIMMY)), h("p", { class: "bubble" }, text));
}

export function counter(icon, value, label, bg) {
  return h("div", { class: "counter", style: { background: bg }, "aria-label": label + ": " + value }, svg(ICONS[icon]), h("span", { class: "num" }, value));
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

export function stat({ kind, value, unit, source }) {
  const k = KINDS[kind];
  if (!k) throw new Error("stat(): unknown kind " + kind);
  if ((kind === "personal" || kind === "community_virtual") && !/virtual/i.test(unit)) {
    throw new Error("stat(): " + kind + " production must be labelled virtual (got unit '" + unit + "')");
  }
  if (kind === "official" && !(source && source.name && source.date)) {
    throw new Error("stat(): an official statistic needs a source name and date");
  }
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
