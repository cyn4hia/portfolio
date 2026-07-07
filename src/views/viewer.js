import { icons } from "../icons.js";
import { el, fmtApprox, countUp, typeText, formatDate, clamp, pad2, reducedMotion } from "../utils.js";
import { site, visibleAccounts } from "../data/accounts.js";

// deliberately just the two headline numbers — counts drift too fast to
// keep anything more granular honest
const STAT_LABELS = {
  views: "views",
  likes: "likes",
};

export function renderViewer(root, { account, startIndex, onBack, onOpenAccount }) {
  const view = el("div", "view viewer");
  const cancels = [];
  const listeners = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    listeners.push(() => target.removeEventListener(type, fn, opts));
  };

  let idx = clamp(startIndex || 0, 0, account.videos.length - 1);
  let landscape = false;
  let muted = true;
  let switching = false;
  let currentLayer = null;
  let currentVideo = null;

  // per-stat max across the account, for the meter bars
  const maxStat = {};
  for (const key of Object.keys(STAT_LABELS)) {
    maxStat[key] = Math.max(1, ...account.videos.map((v) => v.stats[key] || 0));
  }

  /* ---------------------------------------------------------- header */
  const head = el("div", "stage-head");
  const back = el("button", "btn-ghost", `<span class="icon">${icons.arrowLeft}</span><span class="bl">close tab</span>`);
  back.dataset.cursor = "link";
  back.addEventListener("click", onBack);
  head.append(back);

  const headTabs = el("div", "head-tabs");
  for (const acc of visibleAccounts()) {
    const t = el("button", "head-tab", acc.handle);
    if (acc.id === account.id) t.classList.add("active");
    else {
      t.dataset.cursor = "link";
      t.addEventListener("click", () => onOpenAccount(acc.id, 0));
    }
    headTabs.append(t);
  }
  head.append(headTabs);

  const hudToggle = el("button", "btn-ghost hud-toggle", `<span class="icon">${icons.notes}</span><span class="bl">notes</span>`);
  hudToggle.addEventListener("click", () => hudWrap.classList.toggle("open"));
  head.append(hudToggle);

  const rotateBtn = el("button", "btn-ghost", `<span class="icon">${icons.expand}</span><span class="bl">full screen</span>`);
  rotateBtn.dataset.cursor = "link";
  rotateBtn.addEventListener("click", () => setLandscape(!landscape, true));
  head.append(rotateBtn);

  const muteBtn = el("button", "btn-ghost", `<span class="icon">${icons.soundOff}</span>`);
  muteBtn.dataset.cursor = "link";
  muteBtn.addEventListener("click", () => {
    muted = !muted;
    muteBtn.querySelector(".icon").innerHTML = muted ? icons.soundOff : icons.soundOn;
    if (currentVideo) currentVideo.muted = muted;
  });
  head.append(muteBtn);

  const headIdx = el("div", "head-idx");
  head.append(headIdx);
  view.append(head);

  /* ----------------------------------------------------------- stage */
  const stage = el("div", "stage");
  const hudWrap = el("div", "hud-wrap");

  // left rail: performance stats
  const railL = el("aside", "rail rail-left");
  const statsCard = el("div", "rail-card");
  statsCard.append(
    el("div", "rail-head", `<span class="icon">${icons.chart}</span>performance<span class="rail-idx stats-idx"></span>`)
  );
  const statRows = {};
  for (const key of Object.keys(STAT_LABELS)) {
    const row = el("div", "srow");
    const top = el("div", "srow-top");
    top.append(el("span", "srow-label", STAT_LABELS[key]));
    const num = el("span", "srow-num", "0");
    top.append(num);
    const meter = el("div", "meter", "<i></i>");
    row.append(top, meter);
    statsCard.append(row);
    statRows[key] = { num, bar: meter.firstElementChild };
  }
  statsCard.append(el("div", "rail-foot", "rounded down — counts move daily"));
  railL.append(statsCard);

  // right rail: field notes
  const railR = el("aside", "rail rail-right");
  const notesCard = el("div", "rail-card");
  notesCard.append(
    el("div", "rail-head", `<span class="icon">${icons.notes}</span>field notes<span class="rail-idx notes-idx"></span>`)
  );
  const noteHook = el("div", "note-hook");
  const noteParas = el("div", "note-paras");
  const noteTags = el("div", "note-tags");
  const noteMeta = el("div", "note-meta");
  notesCard.append(noteHook, noteParas, noteTags, noteMeta);
  railR.append(notesCard);

  hudWrap.append(railL, railR);

  // the phone
  const scene = el("div", "phone-scene");
  const rig = el("div", "phone-rig");
  rig.dataset.cursor = "drag";
  rig.dataset.cursorLabel = "drag";
  const flip = el("div", "phone-flip");
  const phone = el("div", "phone");
  const screen = el("div", "screen");
  const island = el("div", "island");
  const playFlash = el("div", "play-flash", `<span class="icon">${icons.play}</span>`);
  const progress = el("div", "progress", "<i></i>");
  screen.append(island, playFlash, progress);
  phone.append(screen);
  flip.append(phone);
  rig.append(flip);
  scene.append(rig);

  stage.append(hudWrap, scene);
  view.append(stage);

  /* ------------------------------------------------------- filmstrip */
  const strip = el("div", "filmstrip");
  const scroll = el("div", "strip-scroll");
  const frames = account.videos.map((v, i) => {
    const f = el("button", "frame");
    f.dataset.cursor = "link";
    f.innerHTML = `
      <span class="frame-num">${pad2(i + 1)}</span>
      <span class="frame-dur">${v.duration}</span>
      <span class="frame-title">${v.title}</span>`;
    f.addEventListener("click", () => setVideo(i));
    scroll.append(f);
    return f;
  });
  strip.append(scroll);
  strip.append(
    el(
      "div",
      "strip-keys",
      `<span><b>&larr;&rarr;</b>videos</span><span><b>R</b>full screen</span><span><b>M</b>sound</span><span><b>SPACE</b>play</span>`
    )
  );
  view.append(strip);

  /* ------------------------------------------------------ screen layers */
  function buildLayer(video) {
    const layer = el("div", "layer");
    const fit = el("div", "fit");
    // 16:9 letterbox band inside the vertical screen; fills it in landscape
    const media = el("div", "media");

    if (video.src) {
      const vid = document.createElement("video");
      vid.src = video.src;
      if (video.poster) vid.poster = video.poster;
      vid.loop = true;
      vid.muted = muted;
      vid.playsInline = true;
      vid.preload = "metadata";
      media.append(vid);
      layer._video = vid;
    } else {
      const ph = el("div", "static");
      ph.innerHTML = `
        <div class="static-inner">
          <span class="icon">${icons.play}</span>
          <div class="l1">awaiting footage</div>
          <div class="l2">public/videos/${account.id}/${video.id}.mp4</div>
        </div>`;
      media.append(ph);
    }

    // tiktok's "watch in full screen" pill, pinned to the video itself —
    // this is the control that turns the phone
    const pill = el(
      "button",
      "fs-pill",
      `<span class="icon">${icons.expand}</span><span class="pl">full screen</span>`
    );
    pill.dataset.cursor = "link";
    pill.addEventListener("pointerdown", (e) => e.stopPropagation());
    pill.addEventListener("click", () => setLandscape(!landscape, true));
    media.append(pill);

    fit.append(media);
    layer.append(fit);

    // tiktok-style overlay (portrait only)
    const ui = el("div", "screen-ui");
    ui.innerHTML = `
      <div class="sui-top"><span>following</span><span class="on">for you</span></div>
      <div class="sui-actions">
        <div class="sui-act"><span class="icon">${icons.play}</span><span>${fmtApprox(video.stats.views)}</span></div>
        <div class="sui-act"><span class="icon">${icons.heart}</span><span>${fmtApprox(video.stats.likes)}</span></div>
      </div>
      <div class="sui-caption">
        <div class="h">${account.handle}</div>
        <div class="t">${video.title} — ${video.hook}</div>
      </div>`;
    layer.append(ui);
    return layer;
  }

  function setVideo(next, instant = false) {
    next = clamp(next, 0, account.videos.length - 1);
    if (switching || (currentLayer && next === idx && !instant)) return;
    const dir = next >= idx ? "next" : "prev";
    const video = account.videos[next];
    idx = next;

    // build + animate screen layer
    const incoming = buildLayer(video);
    const outgoing = currentLayer;
    if (currentVideo) currentVideo.pause();
    currentLayer = incoming;
    currentVideo = incoming._video || null;
    screen.insertBefore(incoming, playFlash);

    if (outgoing && !reducedMotion && !instant) {
      switching = true;
      incoming.classList.add(`in-${dir}`);
      outgoing.classList.add(`out-${dir}`);
      setTimeout(() => {
        outgoing.remove();
        incoming.classList.remove(`in-${dir}`);
        switching = false;
      }, 580);
    } else if (outgoing) {
      outgoing.remove();
    }

    if (currentVideo) {
      currentVideo.muted = muted;
      currentVideo.play().catch(() => {});
      on(currentVideo, "timeupdate", () => {
        if (currentVideo.duration) {
          progress.firstElementChild.style.width = `${(currentVideo.currentTime / currentVideo.duration) * 100}%`;
        }
      });
    } else {
      progress.firstElementChild.style.width = "0%";
    }

    updateHud(video);
    frames.forEach((f, i) => f.classList.toggle("active", i === idx));
    frames[idx].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    headIdx.innerHTML = `<b>${pad2(idx + 1)}</b> / ${pad2(account.videos.length)}`;
    history.replaceState(null, "", `#/a/${account.id}/${idx}`);
  }

  function updateHud(video) {
    cancels.splice(0).forEach((c) => c());
    view.querySelector(".stats-idx").textContent = pad2(idx + 1);
    view.querySelector(".notes-idx").textContent = pad2(idx + 1);

    for (const key of Object.keys(STAT_LABELS)) {
      const value = video.stats[key] || 0;
      cancels.push(countUp(statRows[key].num, value, { format: fmtApprox }));
      statRows[key].bar.style.width = `${Math.max(4, (value / maxStat[key]) * 100)}%`;
    }

    cancels.push(typeText(noteHook, video.hook, { speed: 18 }));
    noteParas.innerHTML = "";
    video.thoughts.forEach((t, i) => {
      const p = el("p", null, t);
      p.style.animationDelay = `${0.35 + i * 0.18}s`;
      noteParas.append(p);
    });
    noteTags.innerHTML = "";
    for (const tag of video.tags || []) noteTags.append(el("span", "chip", tag));
    noteMeta.innerHTML = `<span>posted ${formatDate(video.postedAt)}</span><span>${video.duration}</span><span>16:9</span>`;
  }

  /* ------------------------------------------------- rotate / landscape */
  function setLandscape(next, spin) {
    if (next === landscape) return;
    landscape = next;
    fitPhone();
    view.classList.toggle("landscape", landscape);
    // the pill doubles as the exit control once the phone is turned
    for (const pl of view.querySelectorAll(".fs-pill .pl")) {
      pl.textContent = landscape ? "exit full screen" : "full screen";
    }
    for (const ic of view.querySelectorAll(".fs-pill .icon")) {
      ic.innerHTML = landscape ? icons.collapse : icons.expand;
    }
    if (spin !== false && !reducedMotion) {
      flip.classList.remove("spin");
      void flip.offsetWidth;
      flip.classList.add("spin");
      flip.addEventListener("animationend", () => flip.classList.remove("spin"), { once: true });
    }
  }

  // in landscape the phone's height becomes its on-screen width;
  // scale it so it fills the stage without clipping
  function fitPhone() {
    const stageRect = stage.getBoundingClientRect();
    const phoneH = rig.offsetHeight || 1;
    const scale = landscape
      ? clamp((stageRect.width * 0.82) / phoneH, 0.6, 1.45)
      : 1;
    view.style.setProperty("--phone-scale", scale.toFixed(3));
  }
  on(window, "resize", fitPhone);

  /* --------------------------------------------------- play / pause tap */
  function togglePlay() {
    if (!currentVideo) return;
    if (currentVideo.paused) {
      currentVideo.play().catch(() => {});
      playFlash.querySelector(".icon").innerHTML = icons.play;
    } else {
      currentVideo.pause();
      playFlash.querySelector(".icon").innerHTML = icons.pause;
    }
    playFlash.classList.remove("show");
    void playFlash.offsetWidth;
    playFlash.classList.add("show");
  }

  /* -------------------------------------------- drag the phone to advance */
  let drag = null;
  on(rig, "pointerdown", (e) => {
    drag = { y: e.clientY, x: e.clientX, t: performance.now(), moved: false };
    rig.setPointerCapture(e.pointerId);
    rig.classList.add("dragging");
  });
  on(rig, "pointermove", (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (Math.abs(dy) > 6) drag.moved = true;
    const tilt = clamp(-dy / 14, -16, 16);
    const base = landscape ? "rotate(-90deg)" : "rotate(0deg)";
    rig.style.transform = `${base} scale(var(--phone-scale)) rotateX(${tilt}deg) translateY(${clamp(dy * 0.25, -40, 40)}px)`;
  });
  const endDrag = (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    const quickTap = !drag.moved && performance.now() - drag.t < 350;
    rig.classList.remove("dragging");
    rig.style.transform = "";
    drag = null;
    if (quickTap) togglePlay();
    else if (dy < -70) setVideo(idx + 1);
    else if (dy > 70) setVideo(idx - 1);
  };
  on(rig, "pointerup", endDrag);
  on(rig, "pointercancel", endDrag);

  /* ------------------------------------------------------- wheel + keys */
  let wheelLock = 0;
  on(
    view,
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) < 24) return;
      const now = performance.now();
      if (now - wheelLock < 750) return;
      wheelLock = now;
      setVideo(idx + (e.deltaY > 0 ? 1 : -1));
    },
    { passive: true }
  );
  on(window, "keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") setVideo(idx + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") setVideo(idx - 1);
    else if (e.key === "r" || e.key === "R") setLandscape(!landscape, true);
    else if (e.key === "m" || e.key === "M") muteBtn.click();
    else if (e.key === " ") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "Escape") onBack();
  });

  root.append(view);
  fitPhone();
  setVideo(idx, true);

  return () => {
    cancels.splice(0).forEach((c) => c());
    listeners.splice(0).forEach((off) => off());
    if (currentVideo) currentVideo.pause();
  };
}
