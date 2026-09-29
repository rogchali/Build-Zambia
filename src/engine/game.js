// Game = content + player + ledger, with save-after-every-change.
// Screens call these methods; they never touch the ledger directly.

import { makeEvent } from "./ledger.js";
import * as R from "./rules.js";

export class Game {
  constructor(content, store) {
    this.content = content;
    this.store = store;
    this.player = null;
    this.events = [];
    this.listeners = new Set();
  }

  async load() {
    this.player = (await this.store.get("player")) || null;
    this.events = (await this.store.get("ledger")) || [];
    return this;
  }

  get state() {
    return R.derive(this.events, this.content);
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // profile: { nickname, ageBand, province }
  async createPlayer(profile, playerId) {
    this.player = { id: playerId, ...profile, createdAt: new Date().toISOString(), schemaVersion: 1 };
    this.events = [];
    await this.store.set("player", this.player);
    await this.apply(R.startDraft(this.content));
  }

  async apply(draft) {
    if (!draft || draft.error) return draft || { error: "no-draft" };
    const ev = makeEvent(draft, {
      playerId: this.player.id,
      seq: this.events.length + 1,
      contentVersion: this.content.version,
    });
    this.events = [...this.events, ev];
    await this.store.set("ledger", this.events);
    this.listeners.forEach((fn) => fn(this.state));
    return ev;
  }

  task(missionId, stepId, kind) {
    return this.apply(R.taskDraft(this.state, this.content, missionId, stepId, kind));
  }
  buy(itemId, missionId, stepId) {
    return this.apply(R.purchaseDraft(this.state, this.content, itemId, missionId, stepId));
  }
  complete(missionId, opts) {
    return this.apply(R.completeDraft(this.state, this.content, missionId, opts));
  }
  isUnlocked(missionId) {
    return R.isUnlocked(this.state, missionId, this.content);
  }
}
