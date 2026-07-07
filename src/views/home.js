import { icons } from "../icons.js";
import { el, fmtApprox, countUp, typeText, pad2 } from "../utils.js";
import { site, visibleAccounts, hiddenCount } from "../data/accounts.js";

export function renderHome(root, { onOpenAccount, initialAccountId }) {
  const view = el("div", "view home");
  const cancels = [];

  // background marquee
  const marquee = el("div", "marquee");
  const line = `${site.name} — portfolio — short-form — `.toUpperCase();
  const row1 = el("div", "marquee-row", (line.repeat(6) + line.repeat(6)));
  const row2 = el("div", "marquee-row rev", (line.repeat(6) + line.repeat(6)));
  marquee.append(row1, row2);
  view.append(marquee);

  // corners
  view.append(el("div", "home-corner tl", `${site.name} / video portfolio`));
  const tr = el("div", "home-corner tr", `<span class="pulse"></span>${site.status}`);
  view.append(tr);
  view.append(el("div", "home-hint", "select a tab — open a portfolio"));

  // the window
  const accountsList = visibleAccounts();
  let active = Math.max(0, accountsList.findIndex((a) => a.id === initialAccountId));

  const win = el("div", "window");
  const chrome = el("div", "window-chrome");
  const rowTabs = el("div", "chrome-row");
  rowTabs.append(el("div", "traffic", "<span></span><span></span><span></span>"));

  const strip = el("div", "tab-strip");
  const tabEls = accountsList.map((acc, i) => {
    const tab = el("button", "tab", `<span class="tab-dot"></span>${acc.handle}`);
    tab.dataset.cursor = "link";
    tab.addEventListener("click", () => setActive(i));
    strip.append(tab);
    return tab;
  });
  if (hiddenCount() > 0) {
    const ghost = el(
      "button",
      "tab ghost",
      `<span class="icon">${icons.lock}</span>not yet public`
    );
    ghost.dataset.cursor = "link";
    ghost.dataset.cursorLabel = "locked";
    ghost.addEventListener("click", () => {
      ghost.classList.remove("deny");
      void ghost.offsetWidth; // restart animation
      ghost.classList.add("deny");
    });
    strip.append(ghost);
  }
  rowTabs.append(strip);
  chrome.append(rowTabs);

  const urlRow = el("div", "urlbar-row");
  const urlbar = el("div", "urlbar");
  urlbar.innerHTML = `<span class="icon">${icons.lock}</span>`;
  const urlText = el("span", "url-text");
  urlbar.append(urlText, el("span", "caret"));
  urlRow.append(urlbar);
  chrome.append(urlRow);
  win.append(chrome);

  const body = el("div", "window-body");
  win.append(body);
  view.append(win);

  function setActive(i) {
    active = i;
    tabEls.forEach((t, j) => t.classList.toggle("active", j === i));
    renderProfile(accountsList[i]);
  }

  function renderProfile(acc) {
    cancels.splice(0).forEach((c) => c());
    body.innerHTML = "";
    const profile = el("div", "profile");

    cancels.push(typeText(urlText, `${site.name}://portfolio/${acc.handle.replace("@", "")}`));

    // top: avatar + identity
    const top = el("div", "profile-top");
    const initial = acc.handle.replace("@", "").slice(0, 1);
    top.append(el("div", "avatar", `${initial}.`));

    const id = el("div", "profile-id");
    id.append(
      el(
        "div",
        "profile-handle",
        `${acc.handle}<span class="icon">${icons.check}</span>`
      )
    );
    id.append(el("div", "profile-name", acc.name));

    const stats = el("div", "profile-stats");
    for (const [key, value] of Object.entries(acc.stats)) {
      const s = el("div", "pstat");
      const num = el("div", "pstat-num", "0");
      s.append(num, el("div", "pstat-label", key));
      stats.append(s);
      cancels.push(countUp(num, value, { format: fmtApprox }));
    }
    id.append(stats);
    top.append(id);
    profile.append(top);

    profile.append(el("p", "profile-bio", acc.bio));

    if (acc.highlights.length) {
      const chips = el("div", "profile-chips");
      for (const h of acc.highlights) chips.append(el("span", "chip", h));
      profile.append(chips);
    }

    if (acc.brands?.length) {
      const brands = el("div", "profile-brands");
      brands.append(el("span", "brands-label", "worked with"));
      const row = el("div", "brands-row");
      acc.brands.forEach((b, i) => {
        if (i > 0) row.append(el("span", "brand-sep", "/"));
        row.append(el("span", "brand", b));
      });
      brands.append(row);
      profile.append(brands);
    }

    // actions
    const actions = el("div", "profile-actions");
    const open = el(
      "button",
      "btn-primary",
      `view portfolio<span class="icon">${icons.play}</span>`
    );
    open.dataset.cursor = "link";
    open.dataset.cursorLabel = "open";
    open.addEventListener("click", () => zoomOut(acc.id, 0));
    actions.append(open);
    actions.append(el("span", "profile-count", `${acc.videos.length} videos on file`));
    profile.append(actions);

    // grid of videos
    const grid = el("div", "profile-grid");
    acc.videos.forEach((v, i) => {
      const tile = el("button", "gtile");
      tile.dataset.cursor = "play";
      tile.dataset.cursorLabel = "play";
      tile.innerHTML = `
        <span class="gtile-num">${pad2(i + 1)}</span>
        <span class="gtile-title">${v.title}</span>
        <span class="gtile-views"><span class="icon">${icons.play}</span>${fmtApprox(v.stats.views)}</span>
        <span class="gtile-dur">${v.duration}</span>`;
      tile.addEventListener("click", () => zoomOut(acc.id, i));
      grid.append(tile);
    });
    profile.append(grid);

    body.append(profile);
  }

  // window zooms forward as the wipe carries us into the viewer
  function zoomOut(accountId, videoIndex) {
    win.classList.add("zooming");
    onOpenAccount(accountId, videoIndex);
  }

  setActive(active);
  root.append(view);

  return () => cancels.splice(0).forEach((c) => c());
}
