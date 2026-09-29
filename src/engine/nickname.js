// Nickname filter. Collect nicknames only — never real names, phones or emails.
// Returns { ok: true } or { ok: false, reason } where reason is a strings key.

const LOOKALIKE = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };

export function normalise(name) {
  return name.toLowerCase().replace(/[013457@$!]/g, (c) => LOOKALIKE[c]).replace(/[_\s.-]/g, "");
}

export function checkNickname(raw, blocklist) {
  const name = (raw || "").trim();
  if (/@|\.(com|net|org|zm|co)\b/i.test(name)) return { ok: false, reason: "nickname.email" };
  // 5+ digits anywhere (ignoring separators) looks like part of a phone number.
  if ((name.match(/\d/g) || []).length >= 5) return { ok: false, reason: "nickname.phone" };
  if (name.length < 3) return { ok: false, reason: "nickname.tooShort" };
  if (name.length > 16) return { ok: false, reason: "nickname.tooLong" };
  // No spaces: stops "Firstname Lastname" full names.
  if (!/^[A-Za-z0-9_]+$/.test(name)) return { ok: false, reason: "nickname.badChars" };
  const n = normalise(name);
  if (blocklist.some((w) => n.includes(w))) return { ok: false, reason: "nickname.blocked" };
  return { ok: true };
}
