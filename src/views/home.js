import { icons } from "../icons.js";
import { el, fmtApprox, countUp, typeText, pad2, clamp, reducedMotion, assetUrl } from "../utils.js";
import { site, visibleAccounts, hiddenCount } from "../data/accounts.js";
import { createSky } from "../stars.js";

/* ----------------------------------------------------- seeded generatives */
// the grid tiles' sparklines must draw the same curve on every visit, so
// they're seeded from a stable number instead of Math.random
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 12-point declining retention curve for the window's grid tiles
function sparkline(seed) {
  const rnd = mulberry32(seed >>> 0);
  let v = 4 + rnd() * 3;
  const pts = [];
  for (let i = 0; i < 12; i++) {
    pts.push(`${(i * (100 / 11)).toFixed(1)},${clamp(v, 3, 25).toFixed(1)}`);
    v += 0.3 + rnd() * 2.6;
  }
  return `<svg class="spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><polyline vector-effect="non-scaling-stroke" points="${pts.join(" ")}"/></svg>`;
}

// module-scoped so it survives route changes: the about card introduces
// itself on the first hover of the session only — coming back from the
// viewer must not re-trigger it
let aboutAutoShown = false;

export function renderHome(root, { onOpenAccount, onOpenCollection, initialAccountId }) {
  const view = el("div", "view home");
  const profileCancels = []; // reset on every tab switch
  const viewCancels = []; // reset only on unmount
  const ceremonial = !reducedMotion;
  let firstPaint = true;

  // the sky — the transition's surviving meteors land here (stars.js
  // splices them over mid-flight, so it must exist before the veil lifts)
  const sky = createSky(view);
  viewCancels.push(() => sky.destroy());

  /* -------------------------------------------------- fold one: the window */
  const fold = el("div", "home-fold");

  // corners
  fold.append(el("div", "home-corner tl", `${site.name} / video portfolio`));
  const tr = el(
    "div",
    "home-corner tr",
    `<span class="pulse"></span><span class="status-l">${site.status}</span>`
  );
  const aboutBtn = el("button", "about-btn", "about me");
  aboutBtn.dataset.cursor = "link";
  tr.append(aboutBtn);
  fold.append(tr);
  const hint = el("div", "home-hint", `select a tab — scroll for more<span class="chev"></span>`);
  fold.append(hint);

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
    if (ceremonial) tab.style.animationDelay = `${(0.64 + i * 0.07).toFixed(2)}s`;
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
    if (ceremonial) ghost.style.animationDelay = `${(0.64 + tabEls.length * 0.07).toFixed(2)}s`;
    ghost.addEventListener("click", () => {
      ghost.classList.remove("deny");
      ghost.style.animationDelay = ""; // entrance stagger must not delay the shake
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
  fold.append(win);

  function setActive(i) {
    active = i;
    tabEls.forEach((t, j) => t.classList.toggle("active", j === i));
    renderProfile(accountsList[i]);
  }

  // on first paint the profile joins the arrival cascade: typing and number
  // rolls are deferred until the window is actually visible; tab switches
  // keep today's immediate feel
  function renderProfile(acc) {
    const ceremony = ceremonial && firstPaint;
    firstPaint = false;
    profileCancels.splice(0).forEach((c) => c());
    body.innerHTML = "";
    const profile = el("div", "profile");
    if (ceremony) profile.style.animationDelay = "0.8s";

    const url = `${site.name}://portfolio/${acc.handle.replace("@", "")}`;
    const startType = () => profileCancels.push(typeText(urlText, url));
    if (ceremony) {
      const t = setTimeout(startType, 760);
      profileCancels.push(() => clearTimeout(t));
    } else {
      startType();
    }

    // top: avatar + identity — real profile picture when set, monogram otherwise
    const top = el("div", "profile-top");
    const av = el("div", "avatar");
    if (acc.avatar) {
      av.innerHTML = `<img src="${assetUrl(acc.avatar)}" alt="${acc.handle} profile picture" />`;
    } else {
      av.textContent = `${acc.handle.replace("@", "").slice(0, 1)}.`;
    }
    top.append(av);

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
    const statStarts = [];
    for (const [key, value] of Object.entries(acc.stats)) {
      // views is the headline number — give it the hero treatment
      const s = el("div", `pstat${key === "views" ? " hero" : ""}`);
      const num = el("div", "pstat-num", "0");
      s.append(num, el("div", "pstat-label", key));
      stats.append(s);
      statStarts.push(() => profileCancels.push(countUp(num, value, { format: fmtApprox })));
    }
    if (ceremony) {
      const t = setTimeout(() => statStarts.forEach((f) => f()), 940);
      profileCancels.push(() => clearTimeout(t));
    } else {
      statStarts.forEach((f) => f());
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

    // actions — the brands credit sits beside the button on desktop and
    // stacks above it on mobile (css flips the order)
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
    if (acc.brands?.length) {
      const brands = el("div", "profile-brands");
      brands.append(el("span", "brands-label", "worked with"));
      const row = el("div", "brands-row");
      acc.brands.forEach((b, i) => {
        if (i > 0) row.append(el("span", "brand-sep", "/"));
        row.append(el("span", "brand", b));
      });
      brands.append(row);
      actions.append(brands);
    }
    profile.append(actions);

    // grid of videos
    const grid = el("div", "profile-grid");
    acc.videos.forEach((v, i) => {
      const tile = el("button", "gtile");
      tile.dataset.cursor = "play";
      tile.dataset.cursorLabel = "play";
      if (ceremony) tile.style.animationDelay = `${(1.15 + i * 0.045).toFixed(3)}s`;
      // real cover art when a poster is set; procedural pattern otherwise
      if (v.poster) tile.classList.add("has-poster");
      tile.innerHTML = `
        ${v.poster ? `<img class="gtile-poster" src="${assetUrl(v.poster)}" alt="" loading="lazy" /><span class="gtile-scrim"></span>` : ""}
        <span class="gtile-num">${pad2(i + 1)}</span>
        ${v.poster ? "" : sparkline(v.stats.views)}
        <span class="gtile-title">${v.title}</span>
        <span class="gtile-views"><span class="icon">${icons.play}</span>${fmtApprox(v.stats.views)}</span>
        <span class="gtile-dur">${v.duration}</span>`;
      tile.addEventListener("click", () => zoomOut(acc.id, i));
      grid.append(tile);
    });
    profile.append(grid);

    // content buttons — this account only. one per collection (motion /
    // anime / ai), sitting as a compact row under the featured grid; each
    // opens that category's own reel in the viewer
    if (acc.collections?.length) {
      const cols = el("div", "collections");
      acc.collections.forEach((col, ci) => {
        const btn = el("button", "collection-btn");
        btn.dataset.col = col.id;
        btn.dataset.cursor = "link";
        btn.dataset.cursorLabel = "open";
        if (ceremony) btn.style.animationDelay = `${(1.3 + ci * 0.08).toFixed(3)}s`;
        btn.innerHTML = `
          <span class="cbtn-name">${col.label}</span>
          <span class="cbtn-meta mono"><span class="icon">${icons.play}</span>${pad2(col.videos.length)} clips</span>`;
        btn.addEventListener("click", () => {
          win.classList.add("zooming");
          onOpenCollection(acc.id, col.id, 0);
        });
        cols.append(btn);
      });
      profile.append(cols);
    }

    body.append(profile);
  }

  // window zooms forward as the storm carries us into the viewer
  function zoomOut(accountId, videoIndex) {
    win.classList.add("zooming");
    onOpenAccount(accountId, videoIndex);
  }

  /* -------------------------------------------------- the about card */
  // hovering the account window slides in a self-introduction from the
  // right; it stays while the pointer is on either, and the corner button
  // pins it open (the only way in on touch screens)
  const about = site.about;
  const aboutCard = el("aside", "about-card");
  if (about) {
    const head = el("div", "about-head mono");
    head.append(el("span", null, about.label));
    const closeBtn = el("button", "about-close", `<span class="icon">${icons.x}</span>`);
    closeBtn.dataset.cursor = "link";
    head.append(closeBtn);
    aboutCard.append(head);

    const body = el("div", "about-body");
    body.append(el("div", "about-title", about.title));
    // the portrait is the card's flexible element: it swells or shrinks to
    // absorb whatever height the text leaves over
    const aboutAv = el("div", "about-avatar");
    aboutAv.innerHTML = about.avatar
      ? `<img src="${assetUrl(about.avatar)}" alt="" />`
      : `<span class="icon">${icons.user}</span>`;
    const avWrap = el("div", "about-avatar-wrap");
    avWrap.append(aboutAv);
    body.append(avWrap);
    for (const line of about.lines) body.append(el("p", null, line));
    if (about.facts?.length) {
      const facts = el("div", "about-facts");
      for (const f of about.facts) {
        facts.append(el("div", "afact", `<span class="af-l">${f.label}</span><span class="af-v">${f.value}</span>`));
      }
      body.append(facts);
    }
    aboutCard.append(body);
    view.append(aboutCard);

    let pinned = false;

    // the card keeps its own content height and simply centers on the
    // window's vertical midline — it no longer stretches to match the window,
    // so a taller profile doesn't drag it out of shape (sheet layout on small
    // screens sizes itself). offset geometry ignores the tilt transform, so
    // the midline reading stays true
    const sizeAbout = () => {
      if (innerWidth > 720) {
        const foldTop = win.offsetParent ? win.offsetParent.getBoundingClientRect().top : 0;
        const winMid = foldTop + win.offsetTop + win.offsetHeight / 2;
        aboutCard.style.height = "";
        aboutCard.style.top = `${winMid - aboutCard.offsetHeight / 2}px`;
      } else {
        aboutCard.style.height = "";
        aboutCard.style.top = "";
      }
    };
    const sync = () => {
      sizeAbout();
      aboutCard.classList.toggle("open", pinned);
      // drives the triangle tilt: window and card angle toward each other
      view.classList.toggle("about-open", pinned);
      aboutBtn.classList.toggle("active", pinned);
    };
    const onResize = () => sizeAbout();
    addEventListener("resize", onResize);
    view.addEventListener("scroll", sizeAbout, { passive: true });
    viewCancels.push(() => {
      removeEventListener("resize", onResize);
      view.removeEventListener("scroll", sizeAbout);
    });

    // the introduction presents itself exactly once, on the first hover of
    // the profile window — but never before the window has fully spawned.
    // pointermove (not pointerenter) also catches a mouse already resting
    // on the spawn area: its first twitch after arming counts as the hover
    if (matchMedia("(pointer: fine)").matches) {
      let armed = reducedMotion; // no entrance animation to wait for
      win.addEventListener("animationend", (e) => {
        if (e.animationName === "window-in") armed = true;
      });
      const armT = setTimeout(() => {
        armed = true; // safety net if the animation event never lands
      }, 2200);
      viewCancels.push(() => clearTimeout(armT));

      const onFirstMove = () => {
        if (!armed || aboutAutoShown) return;
        aboutAutoShown = true;
        pinned = true;
        sync();
        win.removeEventListener("pointermove", onFirstMove);
      };
      win.addEventListener("pointermove", onFirstMove);
      viewCancels.push(() => win.removeEventListener("pointermove", onFirstMove));
    }
    aboutBtn.addEventListener("click", () => {
      aboutAutoShown = true;
      pinned = !pinned;
      sync();
    });
    closeBtn.addEventListener("click", () => {
      aboutAutoShown = true;
      pinned = false;
      sync();
    });
  }

  view.append(fold);

  // the hint fades once you start scrolling into the profile's lower content
  const onScroll = () => hint.classList.toggle("gone", view.scrollTop > 80);
  view.addEventListener("scroll", onScroll, { passive: true });
  viewCancels.push(() => view.removeEventListener("scroll", onScroll));

  setActive(active);
  root.append(view);

  return () => {
    profileCancels.splice(0).forEach((c) => c());
    viewCancels.splice(0).forEach((c) => c());
  };
}
