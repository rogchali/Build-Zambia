// Mission play: one step at a time — choose, see the consequence, answer a quick question.
import { h, svg } from "../ui/h.js";
import { ICONS } from "../ui/icons.js";
import { button, coinPill, guide, iconButton, letterBlocks, meter } from "../ui/components.js";
import { t, tx, fmt } from "../i18n.js";
import { MissionRun, optionCost, optionYieldPct } from "../engine/mission.js";

export async function playScreen(ctx, missionId) {
  const { game, content } = ctx;
  const m = content.missions.missions.find((x) => x.id === missionId);
  if (!m || !content.play[missionId] || !game.isUnlocked(missionId)) return ctx.go("map");
  const run = await new MissionRun(game, missionId).start();
  const root = h("main", { class: "stack" });
  let selected = null; // option picked but not yet confirmed
  let busy = false;

  async function act(fn) {
    if (busy) return;
    busy = true;
    try { await fn(); } finally { busy = false; }
    render();
  }

  function progress() {
    const total = run.mission.steps.length;
    return h(
      "div",
      { class: "steps", role: "img", "aria-label": t("play.step", { n: run.s.stepIndex + 1, total }) },
      run.mission.steps.map((s, i) =>
        h("span", { class: "stepdot" + (i < run.s.stepIndex ? " done" : i === run.s.stepIndex ? " now" : "") }, i + 1)
      )
    );
  }

  function optionButton(o, i) {
    const cost = optionCost(o, content);
    const afford = run.canAfford(o);
    const on = selected === o.id;
    return h(
      "button",
      {
        type: "button",
        class: "option" + (on ? " on" : "") + (afford ? "" : " cant"),
        "aria-pressed": String(on),
        "aria-disabled": afford ? null : "true",
        onclick: () => {
          if (!afford) return ctx.toast(t("play.needCoins", { n: fmt(cost) }));
          selected = o.id;
          render();
        },
      },
      h("span", { class: "option-letter" }, String.fromCharCode(65 + i)),
      h("span", { class: "option-text" }, h("span", { class: "option-title" }, tx(o.text)), o.note ? h("span", { class: "option-note" }, tx(o.note)) : null),
      h("span", { class: "option-cost" }, svg(ICONS.coin), h("span", { class: "num" }, cost ? fmt(cost) : "0"))
    );
  }

  function chooseView(step) {
    return [
      h("h2", { class: "step-title", tabindex: "-1" }, tx(step.title)),
      guide(tx(step.prompt)),
      h("div", { class: "options" }, step.options.map(optionButton)),
      button(tx(step.action), confirm, { variant: selected ? "go" : "go btn-dim" }),
    ];
  }

  function confirm() {
    if (!selected) return ctx.toast(t("play.pick"));
    const o = run.step.options.find((x) => x.id === selected);
    act(async () => {
      const r = await run.choose(selected);
      if (r.error) ctx.toast(t("play.needCoins", { n: fmt(optionCost(o, content)) }));
      selected = null;
    });
  }

  function resultView(step) {
    const o = run.pickedOption;
    const pct = optionYieldPct(o, content);
    const coins = game.events.filter((e) => e.payload?.runId === run.s.runId && e.stepId === step.id).reduce((a, e) => a + e.delta.coins, 0);
    return [
      h("h2", { class: "step-title", tabindex: "-1" }, tx(step.title)),
      h("div", { class: "card picked" }, h("span", { class: "option-title" }, tx(o.text))),
      guide(tx(o.reply), { live: true }),
      h(
        "div",
        { class: "row2" },
        h("div", { class: "chip " + (pct > 0 ? "up" : pct < 0 ? "down" : "flat") }, (pct > 0 ? "+" : "") + pct + "%", h("small", null, t("play.harvest"))),
        h("div", { class: "chip coins" }, (coins >= 0 ? "+" : "") + fmt(coins), h("small", null, t("label.coins")))
      ),
      button(isLast() && !step.quiz ? t("play.finish") : t("play.next"), () => act(next)),
    ];
  }

  function quizView(step) {
    return [
      h("h2", { class: "step-title", tabindex: "-1" }, t("play.quiz")),
      guide(tx(step.quiz.question)),
      h("div", { class: "options" }, step.quiz.options.map((q, i) =>
        h("button", { type: "button", class: "option", onclick: () => act(() => run.answer(i)) },
          h("span", { class: "option-letter" }, String.fromCharCode(65 + i)),
          h("span", { class: "option-text" }, h("span", { class: "option-title" }, tx(q.text))))
      )),
    ];
  }

  function explainView(step) {
    const a = run.s.quiz[step.id];
    return [
      h("h2", { class: "step-title", tabindex: "-1" }, t("play.quiz")),
      h("div", { class: "card answer " + (a.correct ? "right" : "wrong") },
        svg(ICONS[a.correct ? "check" : "cross"]),
        h("span", { class: "option-title" }, a.correct ? t("play.right", { n: fmt(coinsFor("correctAnswer")) }) : t("play.wrong"))),
      guide(tx(step.quiz.explanation), { live: true }),
      button(isLast() ? t("play.finish") : t("play.next"), () => act(next)),
    ];
  }

  function coinsFor(kind) {
    const e = game.events.find((x) => x.payload?.runId === run.s.runId && x.stepId === run.step.id && x.payload.kind === kind);
    return e ? e.delta.coins : 0;
  }

  const isLast = () => run.s.stepIndex === run.mission.steps.length - 1;

  async function next() {
    const r = await run.next();
    if (r.done) {
      ctx.lastResult = r.done;
      ctx.go("complete", missionId);
    }
  }

  let lastKey = "";
  function render() {
    const step = run.step;
    const views = { choose: chooseView, result: resultView, quiz: quizView, explain: explainView };
    root.replaceChildren(
      h("div", { class: "topbar" }, iconButton("back", t("label.back"), () => ctx.go("map")), letterBlocks(tx(m.name).toUpperCase(), [m.colour, "#FFFFFF"], true), coinPill(game.state.coins)),
      progress(),
      meter({ value: run.yieldSoFar, goal: run.mission.goal, unit: tx(run.mission.unit), label: t("play.harvest") }),
      ...views[run.stage](step)
    );
    // New step or stage: start at the top and move screen-reader focus to the heading.
    const key = run.s.stepIndex + ":" + run.stage;
    if (key !== lastKey && lastKey) {
      window.scrollTo(0, 0);
      root.querySelector(".step-title")?.focus();
    }
    lastKey = key;
  }

  render();
  return root;
}
