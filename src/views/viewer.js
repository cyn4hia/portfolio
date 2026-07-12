import { icons } from "../icons.js";
import { el, fmtApprox, countUp, typeText, formatDate, clamp, pad2, reducedMotion, assetUrl } from "../utils.js";
import { site, visibleAccounts } from "../data/accounts.js";

// deliberately just the two headline numbers — counts drift too fast to
// keep anything more granular honest
const STAT_LABELS = {
  views: "views",
  likes: "likes",
};

// horizontal videos letterbox + earn the full-screen phone rotation;
// vertical ones fill the screen natively (unspecified = vertical)
const isHorizontal = (v) => v.orientation === "horizontal";

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
  let muted = false; // sound stays on; setVideo falls back if autoplay blocks it
  let volume = 1; // persists across videos; the phone-side slider drives it
  let switching = false;
  let currentLayer = null;
  let currentVideo = null;

  // fixed meter scales: a full bar means 100k views / 50k likes
  const STAT_SCALE = { views: 100_000, likes: 50_000 };

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

  // right-side cluster; the tabs float dead-center between back and this
  const headRight = el("div", "head-right");
  head.append(headRight);

  const hudToggle = el("button", "btn-ghost hud-toggle", `<span class="icon">${icons.notes}</span><span class="bl">notes</span>`);
  hudToggle.addEventListener("click", () => hudWrap.classList.toggle("open"));
  headRight.append(hudToggle);

  const rotateBtn = el("button", "btn-ghost", `<span class="icon">${icons.expand}</span><span class="bl">full screen</span>`);
  rotateBtn.dataset.cursor = "link";
  rotateBtn.addEventListener("click", () => setLandscape(!landscape, true));
  headRight.append(rotateBtn);

  const muteBtn = el("button", "btn-ghost", `<span class="icon">${icons.soundOn}</span>`);
  muteBtn.dataset.cursor = "link";
  // one sync point for every sound surface: header button, phone-side
  // slider fill + glyph, and the live video element
  const syncSound = () => {
    muteBtn.querySelector(".icon").innerHTML = muted ? icons.soundOff : icons.soundOn;
    volIcon.innerHTML = muted ? icons.soundOff : icons.soundOn;
    volFill.style.height = `${(muted ? 0 : volume) * 100}%`;
    if (currentVideo) {
      currentVideo.muted = muted;
      currentVideo.volume = volume;
    }
  };
  muteBtn.addEventListener("click", () => {
    muted = !muted;
    if (!muted && volume === 0) volume = 0.5; // unmuting from zero needs a level
    syncSound();
  });
  headRight.append(muteBtn);

  const headIdx = el("div", "head-idx");
  headRight.append(headIdx);
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

  // ios-style volume capsule, hugging the phone's volume keys; it lives on
  // the phone so it rotates along in landscape, like real hardware
  const volCtl = el("div", "vol-ctl");
  volCtl.dataset.cursor = "drag";
  volCtl.dataset.cursorLabel = "volume";
  const volTrack = el("div", "vol-track", `<i class="vol-fill"></i>`);
  const volIcon = el("span", "vol-icon icon", icons.soundOn);
  volCtl.append(volTrack, volIcon);
  phone.append(volCtl);
  const volFill = volTrack.querySelector(".vol-fill");

  // the track's long axis is vertical in portrait and horizontal once the
  // phone rotates; read the level off whichever axis it's on (max volume is
  // the end nearest the phone's top)
  const volFromEvent = (e) => {
    const r = volTrack.getBoundingClientRect();
    const f = landscape
      ? 1 - (e.clientX - r.left) / (r.width || 1)
      : 1 - (e.clientY - r.top) / (r.height || 1);
    volume = Math.round(clamp(f, 0, 1) * 20) / 20;
    muted = volume === 0;
    syncSound();
  };
  volCtl.addEventListener("pointerdown", (e) => {
    e.stopPropagation(); // the phone underneath is draggable
    volCtl.classList.add("dragging");
    volFromEvent(e);
    try {
      volCtl.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic events have no capturable pointer */
    }
  });
  volCtl.addEventListener("pointermove", (e) => {
    if (volCtl.classList.contains("dragging")) volFromEvent(e);
  });
  const volEnd = () => volCtl.classList.remove("dragging");
  volCtl.addEventListener("pointerup", volEnd);
  volCtl.addEventListener("pointercancel", volEnd);
  volCtl.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      e.stopPropagation(); // don't advance the reel
      volume = clamp(volume + (e.deltaY < 0 ? 0.05 : -0.05), 0, 1);
      muted = volume === 0;
      syncSound();
    },
    { passive: false }
  );
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
      <span class="frame-ori icon">${isHorizontal(v) ? icons.horizontal : icons.vertical}</span>
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
    const horizontal = isHorizontal(video);
    const layer = el("div", "layer");
    const fit = el("div", "fit");
    // horizontal: a 16:9 letterbox band inside the vertical screen (fills it
    // in landscape) — the wrap exists so the full-screen pill can hang below
    // the video without being clipped by the media box's overflow.
    // vertical: the media owns the whole screen, tiktok-native
    const wrap = el("div", `media-wrap${horizontal ? "" : " v-full"}`);
    const media = el("div", "media");

    if (video.src) {
      const vid = document.createElement("video");
      vid.src = assetUrl(video.src);
      if (video.poster) vid.poster = assetUrl(video.poster);
      vid.loop = true;
      vid.muted = muted;
      vid.volume = volume;
      vid.playsInline = true;
      vid.preload = "metadata";
      vid.disablePictureInPicture = true;
      vid.setAttribute("controlslist", "nodownload noremoteplayback");
      media.append(vid);
      layer._video = vid;

      // slow-connection signal: shows only when the network keeps the video
      // from playing (with a grace delay so fast loads never flash it)
      const buf = el(
        "div",
        "buffering",
        `<span class="buf-chip"><i class="buf-spin"></i><span class="buf-l">slow connection — buffering</span></span>`
      );
      media.append(buf);
      const bufSoon = () => {
        clearTimeout(layer._bufT);
        layer._bufT = setTimeout(() => buf.classList.add("show"), 450);
      };
      const bufHide = () => {
        clearTimeout(layer._bufT);
        buf.classList.remove("show");
      };
      vid.addEventListener("waiting", bufSoon);
      vid.addEventListener("stalled", bufSoon);
      vid.addEventListener("playing", bufHide);
      vid.addEventListener("canplaythrough", bufHide);
      vid.addEventListener("error", () => {
        clearTimeout(layer._bufT);
        buf.querySelector(".buf-spin").remove();
        buf.querySelector(".buf-l").textContent = "video failed to load — check connection";
        buf.classList.add("show");
      });
      bufSoon(); // a slow first load counts too
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

    // tiktok's "watch in full screen" pill — horizontal footage only;
    // this is the control that turns the phone
    if (horizontal) {
      const pill = el(
        "button",
        "fs-pill",
        `<span class="icon">${icons.expand}</span><span class="pl">full screen</span>`
      );
      pill.dataset.cursor = "link";
      pill.addEventListener("pointerdown", (e) => e.stopPropagation());
      pill.addEventListener("click", () => setLandscape(!landscape, true));
      wrap.append(media, pill);
    } else {
      wrap.append(media);
    }
    fit.append(wrap);
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

    // vertical footage has no landscape mode: turn the phone back if
    // needed, and put away the full-screen control
    if (!isHorizontal(video) && landscape) setLandscape(false, true);
    rotateBtn.style.display = isHorizontal(video) ? "" : "none";

    // build + animate screen layer
    const incoming = buildLayer(video);
    const outgoing = currentLayer;
    if (currentVideo) currentVideo.pause();
    currentLayer = incoming;
    currentVideo = incoming._video || null;
    screen.insertBefore(incoming, playFlash);

    if (outgoing) clearTimeout(outgoing._bufT);
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
      currentVideo.volume = volume;
      // browsers can refuse sound-on autoplay before any interaction —
      // fall back to muted playback instead of a frozen first frame
      const vid = currentVideo;
      vid.play().catch(() => {
        if (muted || vid !== currentVideo) return;
        muted = true;
        syncSound();
        vid.play().catch(() => {});
      });
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
      statRows[key].bar.style.width = `${clamp((value / STAT_SCALE[key]) * 100, 4, 100)}%`;
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
    noteMeta.innerHTML = `<span>posted ${formatDate(video.postedAt)}</span><span>${video.duration}</span><span>${isHorizontal(video) ? "16:9" : "9:16"}</span>`;
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
    else if ((e.key === "r" || e.key === "R") && isHorizontal(account.videos[idx]))
      setLandscape(!landscape, true);
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
