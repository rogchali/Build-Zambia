import { loadContent } from "./content/loader.js";
import { openStore } from "./store/db.js";
import { Game } from "./engine/game.js";
import { setStrings } from "./i18n.js";
import { h } from "./ui/h.js";
import { welcomeScreen } from "./screens/welcome.js";

const root = document.getElementById("app");

function toast(msg) {
  const el = h("div", { class: "card", role: "status", style: { position: "fixed", left: "16px", right: "16px", bottom: "16px", maxWidth: "448px", margin: "0 auto", zIndex: 10 } }, msg);
  document.body.append(el);
  setTimeout(() => el.remove(), 2600);
}

async function boot() {
  try {
    const content = await loadContent("./content/");
    setStrings(content.strings);
    const game = await new Game(content, await openStore()).load();
    const ctx = { content, game, toast };
    root.replaceChildren(welcomeScreen(ctx));
  } catch (err) {
    root.replaceChildren(h("div", { class: "card", role: "alert" }, "Something went wrong loading the game. " + err.message));
    console.error(err);
  }
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch((e) => console.warn("SW registration failed", e));
}

boot();
