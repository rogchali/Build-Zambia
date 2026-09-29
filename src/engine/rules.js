// Game rules. Pure functions, no DOM, no storage.
// - derive(events, content)      -> the player's current state
// - *Draft(state, content, ...)  -> an event draft that obeys the rules
//                                   (or { error } if the action isn't allowed)
// All numbers come from content/*.json — nothing is hard-coded here.

// ---------- derived state ----------

export function derive(events, content) {
  const perMissionMP = {};       // missionId -> Mission Points (capped)
  const completed = [];          // mission ids, in first-completion order
  const production = {};         // missionId -> virtual amount
  const inventory = {};          // itemId -> qty
  let coins = 0;
  let bonusPoints = 0;
  const cap = content.economy.points.missionPoints;

  for (const e of events) {
    coins += e.delta.coins;
    bonusPoints += e.delta.bonusPoints;
    if (e.delta.missionPoints && e.missionId) {
      // Defence in depth: a mission can never be worth more than the cap,
      // even if a bad or tampered event claims otherwise.
      perMissionMP[e.missionId] = Math.min(cap, (perMissionMP[e.missionId] || 0) + e.delta.missionPoints);
    }
    if (e.type === "mission_complete" && e.missionId && !completed.includes(e.missionId)) {
      completed.push(e.missionId);
    }
    if (e.type === "purchase" && e.itemId) inventory[e.itemId] = (inventory[e.itemId] || 0) + 1;
    if (e.production) {
      production[e.production.missionId] = (production[e.production.missionId] || 0) + e.production.amount;
    }
  }

  const missionPoints = Object.values(perMissionMP).reduce((a, b) => a + b, 0);
  const state = {
    coins,
    missionPoints,
    missionPointsMax: cap * content.missions.missions.length,
    bonusPoints,
    totalPoints: missionPoints + bonusPoints,
    completed,
    production,
    inventory,
  };
  state.badges = badgesFor(state, content);
  state.level = levelFor(state, content);
  return state;
}

export function levelFor(state, content) {
  let best = content.levels.levels[0];
  for (const lv of content.levels.levels) {
    const okMissions = state.completed.length >= (lv.minMissions || 0);
    const okBonus = state.bonusPoints >= (lv.minBonusPoints || 0);
    if (okMissions && okBonus && lv.n > best.n) best = lv;
  }
  return best;
}

export function badgesFor(state, content) {
  const all = content.missions.missions.length;
  return content.badges.badges
    .filter((b) => (b.missionId ? state.completed.includes(b.missionId) : b.special === "allMissions" && state.completed.length >= all))
    .map((b) => b.id);
}

// Missions unlock in sequence: the first is open, each later one needs the previous completed.
export function isUnlocked(state, missionId, content) {
  const list = [...content.missions.missions].sort((a, b) => a.order - b.order);
  const i = list.findIndex((m) => m.id === missionId);
  if (i < 0) return false;
  return i === 0 || state.completed.includes(list[i - 1].id);
}

export function isReplay(state, missionId) {
  return state.completed.includes(missionId);
}

// ---------- event drafts ----------

export function startDraft(content) {
  return { type: "start", delta: { coins: content.economy.startingCoins } };
}

// kind: "smallTask" | "correctAnswer" | "challenge"
// extra: optional payload fields, e.g. { runId } to tie an award to one play-through.
export function taskDraft(state, content, missionId, stepId, kind, extra = {}) {
  const base = content.economy.coins[kind];
  if (base == null) return { error: "unknown-task-kind" };
  const coins = isReplay(state, missionId) ? Math.round(base * content.economy.replay.coinFactor) : base;
  return { type: "task", missionId, stepId, delta: { coins }, payload: { kind, ...extra } };
}

export function purchaseDraft(state, content, itemId, missionId = null, stepId = null, extra = {}) {
  const item = content.shop.items.find((i) => i.id === itemId);
  if (!item) return { error: "unknown-item" };
  if (state.coins < item.price) return { error: "not-enough-coins" };
  return { type: "purchase", itemId, missionId, stepId, delta: { coins: -item.price }, payload: { ...extra } };
}

// production: { amount, unit } of VIRTUAL output from this run.
export function completeDraft(state, content, missionId, { perfect = false, production = null, runId = null } = {}) {
  const eco = content.economy;
  const replay = isReplay(state, missionId);
  let coins = eco.coins.finishMission + (perfect ? eco.coins.perfectMission : 0);
  if (replay) coins = Math.round(coins * eco.replay.coinFactor);
  return {
    type: "mission_complete",
    missionId,
    delta: {
      missionPoints: replay ? eco.replay.missionPoints : eco.points.missionPoints,
      // The perfect-mission Bonus Points are awarded on the first completion only,
      // so replaying can't farm leaderboard points.
      bonusPoints: perfect && !replay ? eco.points.perfectMissionBonus : 0,
      coins,
    },
    production: production ? { missionId, amount: production.amount, unit: production.unit } : null,
    payload: { perfect, replay, ...(runId ? { runId } : {}) },
  };
}
