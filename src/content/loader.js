// Loads every content file and checks its shape, so a bad edit fails
// loudly on the test page instead of quietly breaking the game.

const FILES = ["version", "targets", "economy", "shop", "levels", "badges", "missions", "flags", "nickname-blocklist"];

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
  return p;
}
