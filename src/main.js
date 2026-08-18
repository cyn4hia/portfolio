import { initCursor } from "./cursor.js";
import { wipe } from "./transition.js";
import { renderHome } from "./views/home.js";
import { renderViewer } from "./views/viewer.js";
import { getAccount, site } from "./data/accounts.js";

const app = document.getElementById("app");
let destroyView = null;

// hash routing keeps refresh + deep links working on GitHub Pages:
//   #/                        -> homepage
//   #/a/<id>/<n>              -> account viewer at video n
//   #/a/<id>/c/<col>/<n>      -> a collection's reel (motion / anime) at clip n
function parseHash() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "a" && parts[1]) {
    const account = getAccount(parts[1]);
    if (account) {
      if (parts[2] === "c" && parts[3]) {
        // collection ids may contain spaces (e.g. "ai talk"), so the hash
        // segment arrives percent-encoded — decode before matching
        const colId = decodeURIComponent(parts[3]);
        const collection = account.collections?.find((c) => c.id === colId);
        if (collection && collection.videos.length) {
          return { name: "viewer", account, collection, index: parseInt(parts[4], 10) || 0 };
        }
      } else if (account.videos.length) {
        return { name: "viewer", account, index: parseInt(parts[2], 10) || 0 };
      }
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
      collection: route.collection || null,
      startIndex: route.index,
      onBack: () => navigate(`#/`),
      onOpenAccount: (id, i) => navigate(`#/a/${id}/${i}`),
    });
  } else {
    document.title = site.title;
    destroyView = renderHome(app, {
      initialAccountId: route.accountId,
      onOpenAccount: (id, i) => navigate(`#/a/${id}/${i}`),
      onOpenCollection: (id, colId, i) => navigate(`#/a/${id}/c/${encodeURIComponent(colId)}/${i}`),
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
  if (e.target.closest("video, .media, .gtile-poster, .avatar, .about-avatar")) {
    e.preventDefault();
  }
});

initCursor();
render(parseHash());
