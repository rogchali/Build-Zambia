// One play-through of a mission. Stages per step:
//   "choose" -> (pick an option) -> "result" -> ["quiz" -> "explain"] -> next step
// Progress is checkpointed to the store after every action, so closing the app
// mid-mission resumes where the player left off. Every award is tied to this
// run's id and checked against the ledger first, so a resume can never pay twice.

import { newId } from "./ledger.js";

export function optionYieldPct(option, content) {
  if (option.item) return content.shop.items.find((i) => i.id === option.item)?.effects?.yieldPct || 0;
  return option.yieldPct || 0;
}

export function optionCost(option, content) {
  return option.item ? content.shop.items.find((i) => i.id === option.item).price : 0;
}

// picks: { stepId: optionId } — yield from the steps chosen so far.
export function computeYield(mission, picks, content) {
  let y = mission.baseYield;
  for (const s of mission.steps) {
    const o = s.options.find((x) => x.id === picks[s.id]);
    if (o) y *= 1 + optionYieldPct(o, content) / 100;
  }
  return Math.round(y);
}

export class MissionRun {
  constructor(game, missionId) {
    this.game = game;
    this.content = game.content;
    this.mission = game.content.play[missionId];
    this.missionId = missionId;
    this.key = "run:" + missionId;
    this.s = null;
  }

  async start() {
    this.s = (await this.game.store.get(this.key)) || null;
    if (!this.s) {
      this.s = { runId: newId(), stepIndex: 0, stage: "choose", picks: {}, quiz: {} };
      await this.save();
    }
    return this;
  }

  save() { return this.game.store.set(this.key, this.s); }
  async abandon() { await this.game.store.del(this.key); }

  get step() { return this.mission.steps[this.s.stepIndex]; }
  get stage() { return this.s.stage; }
  get yieldSoFar() { return computeYield(this.mission, this.s.picks, this.content); }
  get pickedOption() { return this.step.options.find((o) => o.id === this.s.picks[this.step.id]); }

  canAfford(option) { return this.game.state.coins >= optionCost(option, this.content); }

  #paid(stepId, kind) {
    return this.game.events.some((e) => e.payload?.runId === this.s.runId && e.stepId === stepId && (e.payload.kind === kind || (kind === "purchase" && e.type === "purchase")));
  }

  async #award(kind) {
    if (!this.#paid(this.step.id, kind)) await this.game.task(this.missionId, this.step.id, kind, { runId: this.s.runId });
  }

  // Returns { error } if the option can't be afforded.
  async choose(optionId) {
    if (this.s.stage !== "choose") return { error: "wrong-stage" };
    const o = this.step.options.find((x) => x.id === optionId);
    if (!o) return { error: "unknown-option" };
    if (o.item && !this.#paid(this.step.id, "purchase")) {
      const r = await this.game.buy(o.item, this.missionId, this.step.id, { runId: this.s.runId });
      if (r && r.error) return r;
    }
    await this.#award("smallTask");
    if (this.step.challenge && o.best) await this.#award("challenge");
    this.s.picks[this.step.id] = o.id;
    this.s.stage = "result";
    await this.save();
    return { ok: true };
  }

  async answer(index) {
    if (this.s.stage !== "quiz") return { error: "wrong-stage" };
    const correct = !!this.step.quiz.options[index]?.correct;
    if (correct) await this.#award("correctAnswer");
    this.s.quiz[this.step.id] = { index, correct };
    this.s.stage = "explain";
    await this.save();
    return { correct };
  }

  // Moves on. Returns { done: summary } after the last step.
  async next() {
    if (this.s.stage === "result" && this.step.quiz) {
      this.s.stage = "quiz";
    } else if (this.s.stage === "result" || this.s.stage === "explain") {
      if (this.s.stepIndex === this.mission.steps.length - 1) return { done: await this.#finish() };
      this.s.stepIndex += 1;
      this.s.stage = "choose";
    }
    await this.save();
    return {};
  }

  isPerfect() {
    const m = this.mission;
    const quizzesOk = m.steps.filter((s) => s.quiz).every((s) => this.s.quiz[s.id]?.correct);
    const challengesOk = m.steps.filter((s) => s.challenge).every((s) => s.options.find((o) => o.id === this.s.picks[s.id])?.best);
    return quizzesOk && challengesOk && this.yieldSoFar >= m.goal;
  }

  async #finish() {
    const before = this.game.state;
    const produced = this.yieldSoFar;
    const perfect = this.isPerfect();
    const ev = await this.game.complete(this.missionId, {
      perfect,
      runId: this.s.runId,
      production: { amount: produced, unit: this.mission.unit.en },
    });
    const after = this.game.state;
    const coinsEarned = this.game.events
      .filter((e) => e.payload?.runId === this.s.runId && e.delta.coins > 0)
      .reduce((a, e) => a + e.delta.coins, 0);
    await this.abandon();
    return {
      missionId: this.missionId,
      produced,
      goal: this.mission.goal,
      unit: this.mission.unit,
      perfect,
      replay: ev.payload.replay,
      missionPoints: ev.delta.missionPoints,
      bonusPoints: ev.delta.bonusPoints,
      coinsEarned,
      newBadges: after.badges.filter((b) => !before.badges.includes(b)),
      levelBefore: before.level,
      levelAfter: after.level,
    };
  }
}
