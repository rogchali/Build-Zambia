// Loads every content file and checks its shape, so a bad edit fails
// loudly on the test page instead of quietly breaking the game.

const FILES = ["version", "targets", "economy", "shop", "levels", "badges", "missions", "flags", "nickname-blocklist", "profile"];

export async function loadContent(base = "./content/", lang = "en") {
  const entries = await Promise.all(
    FILES.map(async (f) => {
      const res = await fetch(base + f + ".json");
      if (!res.ok) throw new Error("Could not load content/" + f + ".json (" + res.status + ")");
      return [f, await res.json()];
    })
  );
  const c = Object.fromEntries(entries);
  const stringsRes = await fetch(base + "strings/" + lang + ".json");
  const strings = stringsRes.ok ? await stringsRes.json() : {};
  // Step-by-step content for each playable mission (missions.json -> "file").
  const play = {};
  for (const m of c.missions.missions) {
    if (!m.file) continue;
    const res = await fetch(base + m.file);
    if (!res.ok) throw new Error("Could not load content/" + m.file + " (" + res.status + ")");
    play[m.id] = await res.json();
  }
  const content = {
    version: c.version.contentVersion,
    targets: c.targets,
    economy: c.economy,
    shop: c.shop,
    levels: c.levels,
    badges: c.badges,
    missions: c.missions,
    flags: c.flags,
    blocklist: c["nickname-blocklist"].words,
    profile: c.profile,
    play,
    strings,
  };
  const problems = validateContent(content);
  if (problems.length) throw new Error("Content problems:\n- " + problems.join("\n- "));
  return content;
}

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

export function validateContent(c) {
  const p = [];
  if (!isNum(c.version)) p.push("version.contentVersion must be a number");

  const missionIds = (c.missions.missions || []).map((m) => m.id);
  if (missionIds.length !== 8) p.push("missions.json must list exactly 8 missions");
  if (new Set(missionIds).size !== missionIds.length) p.push("missions.json has duplicate ids");

  for (const t of c.targets.targets || []) {
    if (!missionIds.includes(t.missionId)) p.push("targets: unknown missionId " + t.missionId);
    if (!isNum(t.value) || t.value <= 0) p.push("targets: " + t.id + " needs a positive value");
    if (!isNum(t.deadlineYear)) p.push("targets: " + t.id + " needs a deadlineYear");
    for (const k of ["unit", "description", "sourceName", "sourceUrl", "lastVerified"]) {
      if (!(k in t)) p.push("targets: " + t.id + " is missing field " + k);
    }
  }
  for (const id of missionIds) {
    if (!(c.targets.targets || []).some((t) => t.missionId === id)) p.push("targets: no target for mission " + id);
  }

  const e = c.economy;
  for (const k of ["smallTask", "correctAnswer", "challenge", "finishMission", "perfectMission"]) {
    if (!isNum(e.coins?.[k])) p.push("economy.coins." + k + " must be a number");
  }
  if (e.points?.missionPoints !== 1000) p.push("economy.points.missionPoints must be 1000 (brief section 7)");
  if (!isNum(e.startingCoins)) p.push("economy.startingCoins must be a number");

  for (const i of c.shop.items || []) {
    if (!isNum(i.price) || i.price <= 0) p.push("shop: " + i.id + " needs a positive price");
    if (!i.effects || !Object.keys(i.effects).length) p.push("shop: " + i.id + " must give a gameplay effect");
  }

  const lv = c.levels.levels || [];
  if (!lv.length || lv[0].n !== 0) p.push("levels: first level must be n=0 (Beginner)");

  for (const b of c.badges.badges || []) {
    if (b.missionId && !missionIds.includes(b.missionId)) p.push("badges: unknown missionId " + b.missionId);
  }
  if (c.flags.REAL_PRIZES !== false && c.flags.REAL_PRIZES !== true) p.push("flags.REAL_PRIZES must be true or false");

  if (!c.profile?.ageBands?.length || c.profile?.provinces?.length !== 10) p.push("profile.json needs age bands and all 10 provinces");

  for (const [id, m] of Object.entries(c.play || {})) p.push(...validateMission(id, m, c));
  return p;
}

export function validateMission(id, m, c) {
  const p = [];
  const at = (s) => "missions/" + id + ".json: " + s;
  if (m.id !== id) p.push(at("id must be '" + id + "'"));
  if (!isNum(m.baseYield) || !isNum(m.goal)) p.push(at("needs baseYield and goal"));
  if (!/virtual/i.test(m.unit?.en || "")) p.push(at("unit must say 'virtual'"));
  for (const s of m.steps || []) {
    const opts = s.options || [];
    if (!opts.length) p.push(at("step " + s.id + " has no options"));
    // Confirmed rule: a player with 0 coins can always finish.
    if (!opts.some((o) => !o.item)) p.push(at("step " + s.id + " needs a free option"));
    for (const o of opts) {
      if (o.item && !c.shop.items.some((i) => i.id === o.item)) p.push(at("step " + s.id + " uses unknown shop item " + o.item));
      if (!o.item && !isNum(o.yieldPct)) p.push(at("step " + s.id + " option " + o.id + " needs yieldPct"));
    }
    if (s.challenge && !opts.some((o) => o.best)) p.push(at("challenge step " + s.id + " needs a best option"));
    if (s.quiz && s.quiz.options.filter((o) => o.correct).length !== 1) p.push(at("quiz on " + s.id + " needs exactly one correct answer"));
  }
  if (!(m.steps || []).length) p.push(at("has no steps"));
  return p;
}
