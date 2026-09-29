// Seeded randomness for random events (Phase 2) — deterministic so the
// server can later re-check a run from its seed.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// items: [{ weight, ... }]  -> one item, chosen by weight
export function weightedPick(items, rand) {
  const total = items.reduce((s, i) => s + (i.weight || 0), 0);
  let r = rand() * total;
  for (const i of items) {
    r -= i.weight || 0;
    if (r < 0) return i;
  }
  return items[items.length - 1];
}
