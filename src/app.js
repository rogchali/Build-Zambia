import { loadContent } from "./content/loader.js";
import { openStore } from "./store/db.js";
import { Game } from "./engine/game.js";
import { setStrings, t } from "./i18n.js";
import { h } from "./ui/h.js";
import { welcomeScreen } from "./screens/welcome.js";
import { setupScreen } from "./screens/setup.js";
import { mapScreen } from "./screens/map.js";
import { introScreen } from "./screens/intro.js";
import { playScreen } from "./screens/play.js";
import { completeScreen } from "./screens/complete.js";
import { profileScreen } from "./screens/profile.js";
import { privacyScreen } from "./screens/privacy.js";

const root = document.getElementById("app");
const SCREENS = {
  welcome: welcomeScreen,
  setup: setupScreen,
  map: mapScreen,
  intro: introScreen,
  play: playScreen,
  complete: completeScreen,
  profile: profileScreen,
  privacy: privacyScreen,
};
// Screens that need a player; anyone without one goes to setup.
const NEEDS_PLAYER = new Set(["map", "intro", "play", "complete", "profile"]);

function toast(msg) {
  document.querySelector(".toast")?.remove();
  const el = h("div", { class: "toast card", role: "status" }, msg);
  document.body.append(el);
  setTimeout(() => el.remove(), 2600);
}

// Hash routes (#/map, #/intro/maize …) so the phone's Back button works.
function parse() {
  const [name, arg] = location.hash.replace(/^#\/?/, "").split("/");
  return { name: SCREENS[name] ? name : "welcome", arg };
}

let ctx;
let renderSeq = 0;

async function render() {
  const seq = ++renderSeq;
  let { name, arg } = parse();
  if (NEEDS_PLAYER.has(name) && !ctx.game.player) name = "setup";
  const el = await SCREENS[name](ctx, arg);
  if (seq !== renderSeq || !el) return; // a newer navigation happened meanwhile
  root.replaceChildren(el);
  window.scrollTo(0, 0);
}

function go(name, arg) {
  const hash = "#/" + name + (arg ? "/" + arg : "");
  if (location.hash === hash) render();
  else location.hash = hash;
}

async function boot() {
  try {
    const content = await loadContent("./content/");
    setStrings(content.strings);
    const game = await new Game(content, await openStore()).load();
    ctx = { content, game, toast, go, lastResult: null };
    window.addEventListener("hashchange", render);
    render();
  } catch (err) {
    root.replaceChildren(h("div", { class: "card", role: "alert" }, t("error.load") + " " + err.message));
    console.error(err);
  }
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch((e) => console.warn("SW registration failed", e));
}

boot();
