// Tiny IndexedDB key-value store. Falls back to memory if IndexedDB is
// unavailable (private window, blocked storage) — the game still plays,
// progress just won't survive a reload.

const DB_NAME = "build-zambia";
const STORE = "kv";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req && req.result);
    t.onerror = () => reject(t.error);
  });
}

export function memoryStore() {
  const m = new Map();
  return {
    persistent: false,
    get: async (k) => (m.has(k) ? structuredClone(m.get(k)) : undefined),
    set: async (k, v) => void m.set(k, structuredClone(v)),
    del: async (k) => void m.delete(k),
  };
}

export async function openStore() {
  try {
    const db = await open();
    // Ask the browser not to evict saved progress under storage pressure.
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch {}
    return {
      persistent: true,
      get: (k) => tx(db, "readonly", (s) => s.get(k)),
      set: (k, v) => tx(db, "readwrite", (s) => s.put(v, k)),
      del: (k) => tx(db, "readwrite", (s) => s.delete(k)),
    };
  } catch {
    return memoryStore();
  }
}
