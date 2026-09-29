// t("key") reads the strings file; tx({en:"…"}) picks a content
// field's language, falling back to English.

let strings = {};
let lang = "en";

export function setStrings(s, l = "en") {
  strings = s || {};
  lang = l;
}

export function t(key, vars) {
  let s = strings[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll("{" + k + "}", v);
  return s;
}

export function tx(field) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  return field[lang] ?? field.en ?? "";
}

export function fmt(n) {
  return new Intl.NumberFormat("en-ZM").format(n);
}
