// Engine tests — run in the browser via tests/index.html (no Node needed).
import { loadContent, validateContent } from "../src/content/loader.js";
import { Game } from "../src/engine/game.js";
import { memoryStore } from "../src/store/db.js";
import * as R from "../src/engine/rules.js";
import { checkNickname } from "../src/engine/nickname.js";
import { mulberry32, weightedPick } from "../src/engine/rng.js";
import { setStrings } from "../src/i18n.js";

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
function eq(actual, expected, msg = "") {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg} expected ${e}, got ${a}`);
}
function ok(v, msg) { if (!v) throw new Error(msg || "expected truthy"); }

const content = await loadContent("../content/");
setStrings(content.strings);

async function newGame() {
  const g = new Game(content, memoryStore());
  await g.load();
  await g.createPlayer({ nickname: "Tester", ageBand: "10-12", province: "Lusaka" }, "p1");
  return g;
}
const ALL = content.missions.missions.map((m) => m.id);

// ---------- content ----------
test("content passes validation", () => eq(validateContent(content), []));
test("every target has deadline 2031 and no invented source", () => {
  for (const t of content.targets.targets) {
    eq(t.deadlineYear, 2031, t.id);
    eq(t.sourceName, null, t.id + " source must stay pending until supplied");
  }
});
test("coin values and prices match brief section 8", () => {
  eq(content.economy.startingCoins, 500);
  eq(content.economy.coins, { smallTask: 100, correctAnswer: 50, challenge: 200, finishMission: 1000, perfectMission: 250 });
  const prices = Object.fromEntries(content.shop.items.map((i) => [i.id, i.price]));
  eq(prices, { "better-seed": 300, cattle: 500, irrigation: 1200, tractor: 2000, lodge: 3500, "solar-plant": 5000, factory: 8000 });
});
test("REAL_PRIZES is OFF", () => eq(content.flags.REAL_PRIZES, false));

// ---------- new player ----------
test("new player starts with 500 coins, Beginner, nothing earned", async () => {
  const s = (await newGame()).state;
  eq(s.coins, 500); eq(s.missionPoints, 0); eq(s.bonusPoints, 0);
  eq(s.level.n, 0); eq(s.level.name.en, "Beginner"); eq(s.badges, []);
});

// ---------- mission points ----------
test("first completion awards exactly 1,000 Mission Points", async () => {
  const g = await newGame();
  await g.complete("maize", { production: { amount: 500, unit: "virtual tonnes" } });
  eq(g.state.missionPoints, 1000);
});
test("replay earns no Mission Points and 25% coins", async () => {
  const g = await newGame();
  await g.complete("maize");
  const before = g.state.coins;
  await g.complete("maize");
  eq(g.state.missionPoints, 1000, "MP");
  eq(g.state.coins - before, 250, "replay coins (25% of 1000)");
});
test("replayed task coins are 25%", async () => {
  const g = await newGame();
  await g.complete("maize");
  const before = g.state.coins;
  await g.task("maize", "plant", "smallTask");
  eq(g.state.coins - before, 25);
});
test("perfect mission: +250 coins and +100 Bonus Points, first time only", async () => {
  const g = await newGame();
  await g.complete("maize", { perfect: true });
  eq(g.state.coins, 500 + 1000 + 250); eq(g.state.bonusPoints, 100);
  await g.complete("maize", { perfect: true });
  eq(g.state.bonusPoints, 100, "no bonus on replay");
});
test("tampered event can never push a mission above 1,000", () => {
  const ev = { type: "mission_complete", missionId: "maize", delta: { missionPoints: 5000, bonusPoints: 0, coins: 0 } };
  eq(R.derive([ev, ev], content).missionPoints, 1000);
});
test("all 8 missions = 8,000 / 8,000 Mission Points", async () => {
  const g = await newGame();
  for (const id of ALL) await g.complete(id);
  eq(g.state.missionPoints, 8000); eq(g.state.missionPointsMax, 8000);
});
test("total = mission + bonus", async () => {
  const g = await newGame();
  await g.complete("maize", { perfect: true });
  eq(g.state.totalPoints, 1100);
});

// ---------- coins & shop ----------
test("maize can earn roughly 1,500–2,500 coins", async () => {
  const g = await newGame();
  for (let i = 0; i < 7; i++) await g.task("maize", "s" + i, "smallTask");
  for (let i = 0; i < 3; i++) await g.task("maize", "q" + i, "correctAnswer");
  await g.complete("maize", { perfect: true });
  const earned = g.state.coins - 500;
  ok(earned >= 1500 && earned <= 2500, "earned " + earned);
});
test("purchase spends coins and adds to inventory", async () => {
  const g = await newGame();
  await g.buy("better-seed", "maize", "seed");
  eq(g.state.coins, 200); eq(g.state.inventory, { "better-seed": 1 });
});
test("cannot buy without enough coins; balance never negative", async () => {
  const g = await newGame();
  const r = await g.buy("tractor");
  eq(r.error, "not-enough-coins"); eq(g.state.coins, 500);
});

// ---------- unlocks, badges, levels ----------
test("missions unlock in sequence", async () => {
  const g = await newGame();
  ok(g.isUnlocked("maize")); ok(!g.isUnlocked("power"));
  await g.complete("maize");
  ok(g.isUnlocked("power")); ok(!g.isUnlocked("tourism"));
});
test("levels follow mission counts 1/3/5/8", async () => {
  const g = await newGame();
  const seen = [];
  for (const id of ALL) { await g.complete(id); seen.push(g.state.level.n); }
  eq(seen, [1, 1, 2, 2, 3, 3, 3, 4]);
});
test("Master Builder needs all 8 + 5,000 Bonus Points", async () => {
  const g = await newGame();
  for (const id of ALL) await g.complete(id);
  eq(g.state.level.n, 4);
  await g.apply({ type: "bonus", delta: { bonusPoints: 5000 } });
  eq(g.state.level.n, 5);
});
test("badge per mission + I BUILT ZAMBIA at 8/8", async () => {
  const g = await newGame();
  await g.complete("maize");
  eq(g.state.badges, ["maize"]);
  for (const id of ALL.slice(1)) await g.complete(id);
  eq(g.state.badges.length, 9); ok(g.state.badges.includes("i-built-zambia"));
});

// ---------- production (virtual) ----------
test("virtual production is tracked per mission", async () => {
  const g = await newGame();
  await g.complete("maize", { production: { amount: 500, unit: "virtual tonnes" } });
  eq(g.state.production, { maize: 500 });
});

// ---------- persistence ----------
test("progress survives reload from the store", async () => {
  const store = memoryStore();
  const g1 = new Game(content, store); await g1.load();
  await g1.createPlayer({ nickname: "Tester", ageBand: "10-12", province: "Lusaka" }, "p1");
  await g1.complete("maize");
  const g2 = await new Game(content, store).load();
  eq(g2.player.nickname, "Tester"); eq(g2.state.missionPoints, 1000); eq(g2.events.length, 2);
});
test("events record player, sequence and content version", async () => {
  const g = await newGame();
  await g.complete("maize");
  const e = g.events[1];
  eq([e.playerId, e.seq, e.contentVersion, e.type], ["p1", 2, content.version, "mission_complete"]);
});

// ---------- nickname filter ----------
test("nickname filter", () => {
  const b = content.blocklist;
  eq(checkNickname("MaizeKing", b).ok, true);
  eq(checkNickname("Dickson_7", b).ok, true, "innocent names allowed");
  eq(checkNickname("Skills99", b).ok, true);
  eq(checkNickname("John Banda", b).reason, "nickname.badChars");
  eq(checkNickname("0977123456", b).reason, "nickname.phone");
  eq(checkNickname("kid@mail.com", b).reason, "nickname.email");
  eq(checkNickname("sh1tface", b).reason, "nickname.blocked");
  eq(checkNickname("ab", b).reason, "nickname.tooShort");
});

// ---------- rng ----------
test("seeded rng is deterministic", () => {
  const a = mulberry32(42), b = mulberry32(42);
  eq([a(), a(), a()], [b(), b(), b()]);
  const items = [{ id: "x", weight: 0 }, { id: "y", weight: 1 }];
  eq(weightedPick(items, mulberry32(1)).id, "y");
});

// ---------- runner ----------
const out = document.getElementById("out");
let pass = 0, fail = 0;
for (const t of tests) {
  const li = document.createElement("li");
  try { await t.fn(); pass++; li.textContent = "PASS  " + t.name; li.className = "pass"; }
  catch (e) { fail++; li.textContent = "FAIL  " + t.name + " — " + e.message; li.className = "fail"; }
  out.append(li);
}
const sum = document.getElementById("summary");
sum.textContent = `${pass} passed, ${fail} failed`;
sum.className = fail ? "fail" : "pass";
window.__results = { pass, fail };
