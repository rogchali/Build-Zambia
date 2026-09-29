# CLAUDE.md — Build Zambia

Context for Claude Code. Read before changing anything.

## 1. What this is

**BUILD ZAMBIA: The 10•10•5•3•3•1•1•1 Challenge** — a mobile-first, offline
educational game (PWA). Players complete eight national development missions
(Maize, Power, Tourism, Copper, Soya, Beef, Sugar, Wheat) to build their own
Zambia. Tagline: "Eight National Development Missions. One Zambia." / short
"8 Missions. 8 Badges. One Zambia." (kept as-is even though there are 9 badges
counting I BUILT ZAMBIA — decided 2026-09-29).

Owner and data controller: **Three Hills Zambia Ltd**. Players ~8 to adult,
low-to-mid Android phones, slow/intermittent data.

Core loop to protect: PLAY → LEARN → BUILD → EARN → UNLOCK → COMPETE → WIN → RETURN.
The game must be fun WITHOUT prizes.

## 2. Non-negotiables

- **Separate from everything else.** Shares no repo, hosting, database, auth or
  code with the CDF Information System or any campaign/partisan app. Lives at
  `D:\Master File 2\Build Zambia` — deliberately NOT inside the CDF repo folder.
- **Neutral and educational.** Targets stated factually as Zambia's national
  goals. No party colours, slogans, candidates or political messaging. Sponsors
  sponsor a *challenge*, never a message.
- **Three kinds of numbers, never mixed** — every number goes through
  `stat()` in `src/ui/components.js`, which enforces the label and refuses
  bad input:
  - `national_goal` — ZAMBIA'S GOAL (from `content/targets.json`, with source or "Source pending")
  - `personal` — YOUR MISSION (unit must say "virtual")
  - `community_virtual` — COMMUNITY (VIRTUAL) (Phase 3; unit must say "virtual")
  - `official` — OFFICIAL STATISTIC (Phase 4; must carry source name + date)
- **Never invent a target source.** All 8 targets have `deadlineYear: 2031`
  and `sourceName: null` → shown as "Source pending" until Rodger supplies the
  official document. A test enforces this.
- **Child safety.** Collect only nickname, age band, province. No phone,
  email, photo, exact location. No chat or player contact. Nickname filter is
  English only (decision 2026-09-29), no spaces allowed (blocks "First Last"),
  blocks phone/email look-alikes.
- **English only — no local-language words anywhere** (Rodger, 2026-09-29).
  This overrides the brief's local-greeting "flavour" ("Mwaiseni!", "Muli
  shani"): no greetings, phrases or labels in Bemba, Nyanja or any other local
  language. The `{en: …}` content fields and strings file stay as plumbing,
  but add no other language without asking.
- **Prizes off.** `content/flags.json` → `REAL_PRIZES: false` until legal review.
  Build Coins are virtual, no cash value, never purchasable.

## 3. Architecture (no build step)

Node.js is NOT installed on this machine (nor Python), so the app is plain
ES modules served as static files — no bundler, no npm. Decided 2026-09-29.

```
index.html  manifest.webmanifest  service-worker.js  icons/
styles/      tokens.css (mockup palette), base.css
src/
  app.js                boot: load content → open store → render
  i18n.js               t("key") strings, tx({en,…}) content fields
  content/loader.js     loads + validates all content JSON
  store/db.js           IndexedDB key-value (memory fallback)
  engine/ledger.js      append-only events
  engine/rules.js       derive() + event drafts — ALL game rules live here
  engine/game.js        content + player + ledger, saves after each change
  engine/nickname.js    nickname filter
  engine/rng.js         seeded rng + weighted pick (random events)
  ui/h.js  ui/icons.js  ui/components.js
  screens/*.js
content/     all editable data (targets, economy, shop, levels, badges,
             missions, flags, blocklist, strings/en.json, version.json)
tests/       index.html + engine.test.js — runs in the browser
scripts/serve.ps1       local static server (PowerShell HttpListener)
```

**Ledger is the source of truth.** Every reward is an event
`{id, playerId, seq, ts, contentVersion, type, missionId, stepId, itemId,
delta{missionPoints, bonusPoints, coins}, production, payload}`. Coins, points,
badges, level, production and inventory are *derived*, never stored. This is
what lets Phase 3 add community counters and server-side re-validation without
restructuring. `derive()` also caps Mission Points at 1,000 per mission even
if an event claims more.

**Content, not code.** Numbers live in `content/*.json`. Bump
`content/version.json` → `contentVersion` when mission/economy content changes.

## 4. Confirmed game rules (2026-09-29)

- Mission Points: flat **1,000 on first completion** of each mission (max 8,000).
- Perfect mission: +250 coins and +100 Bonus Points — Bonus Points on first completion only.
- Replays: **25% of coins, 0 Mission Points** (`economy.replay`).
- Every step must have a **free option**, so a player with 0 coins can always finish.
- **One shop catalogue** (`content/shop.json`); in-mission choices buy from it.
  Phase 1 has only the in-mission route. Coins can never go negative.
- Missions **unlock in sequence** (roster order in `content/missions.json`).
- Levels: 0 Beginner · 1 Village (1 mission) · 2 District (3) · 3 Provincial (5)
  · 4 Zambia (8) · 5 Master Builder (8 + 5,000 Bonus Points — starting
  proposal, tune in `levels.json`).
- Beef personal unit: **virtual cattle exported**.
- Map: shows total Build Points; Profile shows the Mission/Bonus split.
  Illustrated "Zambia comes alive" map is Phase 2.
- Guide character: **Jimmy** (orange hard hat).
- Age bands (proposed): Under 10 / 10–12 / 13–15 / 16–17 / 18+.

### Maize mission (Phase 1, wording approved 2026-09-30)
Content: `content/missions/maize.json`. 7 steps (prepare, seed, plant, protect,
harvest, store, market), 3 quizzes, Protect is the challenge step. Yield =
320 base × each choice's %, goal 500 virtual tonnes. Best path 526, dry-season
seed path 506, all-free path 405. Perfect run earns exactly 2,300 coins.
- Missing 500 still **completes** the mission (1,000 MP) but isn't perfect;
  Jimmy invites a replay. Perfect = all quizzes right + best Protect + ≥500.
- Wrong quiz answer: explanation shown, no retry.
- `dry-season-seed` (300) added to the shop catalogue (from the mockup).
- Runs are checkpointed to the store (`run:<missionId>`); every award is
  tagged with the run's id and checked against the ledger, so resuming after
  closing the app never pays twice (`src/engine/mission.js`).
- `loader.js` refuses a mission file with a step lacking a free option, a
  quiz without exactly one right answer, or a unit not saying "virtual".

## 5. Phases

0 Foundations (done) · 1 Offline prototype — built on `preview` (profile, map, full
Maize mission, complete screen, profile) · 2 Other 7 missions, random events,
shop, all levels, finale, illustrated map · 3a Backend + Data Protection Act
review · 3b Sync, leaderboards, anti-cheat, community counters · 4 Weekly
challenges, admin, Real Zambia stats · 5 Schools, sponsors, prizes, languages.

**Backend (Phase 3): Supabase** (Rodger's decision) — its own project in its
own organisation, never the CDF one. Supabase has no African region, so the
Data Protection Act No. 3 of 2021 data-localisation and children's-data review
must happen before any player data leaves the device.

## 6. Working rules

- Branch `preview`; nothing merges to `main` without Rodger's approval. Ask
  before every commit/push.
- **Bump `CACHE_VERSION` in `service-worker.js` on any shell/content change**
  (current `bz-v2`), and add any new file to its `PRECACHE` list.
- Test locally: `powershell -ExecutionPolicy Bypass -File scripts\serve.ps1`
  then open `http://localhost:8765/tests/` (engine tests) and `/` (game) at
  360px width.
- The Claude desktop browser pane refuses service-worker registration on the
  local PowerShell server, but it works on the deployed https site — check
  offline behaviour there. Preview deploy: https://preview--build-zambia.netlify.app
  (Netlify site `build-zambia`, branch deploys on; production = `main`).
  Phase 0 check 2026-09-30: SW `bz-v1` activated, all 32 precache files
  cached, a reload served all 27 requests from the SW cache with zero from
  the network, 24/24 engine tests pass live, IndexedDB save/read works.
- Visual reference: mockup canvas https://claude.ai/artifact/6ewdMQxeW4ckLi7CN18kso
- Fonts: Baloo 2 (variable, one file covers 700/800) + Atkinson Hyperlegible
  400/700, Latin subset, self-hosted in `fonts/` (~68 KB total, SIL OFL —
  see `fonts/FONTS.txt`). Never load them from Google at runtime: offline
  play, and no third-party requests from a children's app.
- Rodger prefers concise, well-structured explanations.
