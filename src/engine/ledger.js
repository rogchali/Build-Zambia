// The ledger is the player's source of truth: an append-only list of events.
// Every total (points, coins, badges, level, production) is DERIVED from it,
// never stored — so community counters and server-side anti-cheat can later
// replay the same events without restructuring anything.

export const EVENT_TYPES = Object.freeze([
  "start",            // new game: starting coins
  "task",             // small task / correct answer / challenge inside a mission
  "purchase",         // bought a shop item (in-mission or shop)
  "event_choice",     // random-event choice (Phase 2)
  "mission_complete", // finished a mission (first time or replay)
  "bonus",            // daily quiz, weekly challenge, special challenge (later)
]);

const ZERO = Object.freeze({ missionPoints: 0, bonusPoints: 0, coins: 0 });

export function newId() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

// draft: { type, missionId?, stepId?, itemId?, delta?, production?, payload? }
// ctx:   { playerId, seq, contentVersion, now? }
export function makeEvent(draft, ctx) {
  if (!EVENT_TYPES.includes(draft.type)) throw new Error("Unknown event type: " + draft.type);
  return Object.freeze({
    id: newId(),
    playerId: ctx.playerId,
    seq: ctx.seq,
    ts: (ctx.now || new Date()).toISOString(),
    contentVersion: ctx.contentVersion,
    type: draft.type,
    missionId: draft.missionId || null,
    stepId: draft.stepId || null,
    itemId: draft.itemId || null,
    delta: Object.freeze({ ...ZERO, ...(draft.delta || {}) }),
    // production is always VIRTUAL: { missionId, amount, unit }
    production: draft.production ? Object.freeze({ ...draft.production }) : null,
    payload: draft.payload ? Object.freeze({ ...draft.payload }) : null,
  });
}
