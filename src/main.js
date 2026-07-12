import { initCursor } from "./cursor.js";
import { wipe } from "./transition.js";
import { renderHome } from "./views/home.js";
import { renderViewer } from "./views/viewer.js";
import { getAccount, site } from "./data/accounts.js";

const app = document.getElementById("app");
let destroyView = null;

// hash routing keeps refresh + deep links working on GitHub Pages:
//   #/              -> homepage
//   #/a/<id>/<n>    -> account viewer at video n
function parseHash() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "a" && parts[1]) {
    const account = getAccount(parts[1]);
    if (account && account.videos.length) {
      return { name: "viewer", account, index: parseInt(parts[2], 10) || 0 };
    }
  }
  return { name: "home", accountId: parts[1] || null };
}

function render(route) {
  if (destroyView) destroyView();
  app.innerHTML = "";
  if (route.name === "viewer") {
    document.title = `${route.account.handle} — ${site.title}`;
    destroyView = renderViewer(app, {
      account: route.account,
      startIndex: route.index,
      onBack: () => navigate(`#/`),
      onOpenAccount: (id, i) => navigate(`#/a/${id}/${i}`),
    });
  } else {
    document.title = site.title;
    destroyView = renderHome(app, {
      initialAccountId: route.accountId,
      onOpenAccount: (id, i) => navigate(`#/a/${id}/${i}`),
    });
  }
}

function navigate(hash) {
  if (location.hash === hash) return;
  location.hash = hash;
}

// viewer updates the hash itself (replaceState) while flipping videos, which
// never fires hashchange — only full route changes get the wipe treatment
window.addEventListener("hashchange", () => {
  const route = parseHash();
  wipe(() => render(route));
});

// deter casual saving: no right-click menu on footage, covers, or photos
// (determined users can always capture what a browser plays — this only
// raises the effort bar)
document.addEventListener("contextmenu", (e) => {
  if (e.target.closest("video, .media, .poster-img, .gtile-poster, .avatar, .about-avatar")) {
    e.preventDefault();
  }
});

initCursor();
render(parseHash());
