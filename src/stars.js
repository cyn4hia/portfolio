// stars.js — every star on the site comes from this one engine.
//
// Two canvases share the viewport coordinate space:
//   #storm  (inside #wipe, z-250) — the route-transition meteor storm
//   .sky    (per home view, z-0)  — the persistent homepage starfield
// Because the spaces are identical, a storm meteor can be handed to the sky
// mid-flight and keep streaking from the same pixel: the transition's
// shooting stars decelerate, land, and stay on as the homepage's stars.

import { clamp, reducedMotion } from "./utils.js";

// one heading for every streak on the site: 28° below horizontal, travelling
// left-and-down — the same direction the top marquee row scrolls
const RAD = (28 * Math.PI) / 180;
const DIR = { x: -Math.cos(RAD), y: Math.sin(RAD) };

const WHITE = "244,244,245";
const DPR = () => Math.min(window.devicePixelRatio || 1, 1.5);
const easeInCubic = (t) => t * t * t;
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
const rng = (lo, hi) => lo + Math.random() * (hi - lo);

// the storm timeline, ms from wipe start (transition.js syncs the slate to it)
export const WIPE_T = { cover: 520, reveal: 720, resolve: 780, done: 1530 };

/* ------------------------------------------------------------ glow sprite */
// all glow is one pre-rendered radial sprite — ctx.shadowBlur costs more than
// every other draw in the frame combined
let sprite;
function glow() {
  if (sprite) return sprite;
  sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const g = sprite.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${WHITE},0.9)`);
  grad.addColorStop(0.25, `rgba(${WHITE},0.35)`);
  grad.addColorStop(1, `rgba(${WHITE},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return sprite;
}

/* ---------------------------------------------------------------- meteors */
// trail brightness, head -> tail — enough steps that the taper reads as a
// continuous fade instead of visible banding
const SEGS = [0.9, 0.72, 0.55, 0.4, 0.27, 0.16, 0.08, 0.03];

function jitterDir() {
  const j = ((Math.random() * 8 - 4) * Math.PI) / 180;
  const cos = Math.cos(j);
  const sin = Math.sin(j);
  return { dx: DIR.x * cos - DIR.y * sin, dy: DIR.x * sin + DIR.y * cos };
}

// trail length follows speed, so a decelerating meteor visibly shrinks
// from a streak into a resting point of light
function drawMeteor(ctx, m) {
  const len = clamp(m.speed * 0.06, 2, m.trail);
  const seg = len / SEGS.length;
  ctx.lineCap = "round";
  for (let i = 0; i < SEGS.length; i++) {
    const a = SEGS[i] * m.alpha;
    if (a < 0.012) continue;
    ctx.strokeStyle = `rgba(${WHITE},${a.toFixed(3)})`;
    ctx.lineWidth = Math.max(0.6, m.r * 1.6 * (1 - i / (SEGS.length + 2)));
    ctx.beginPath();
    ctx.moveTo(m.x - m.dx * seg * i, m.y - m.dy * seg * i);
    ctx.lineTo(m.x - m.dx * seg * (i + 1), m.y - m.dy * seg * (i + 1));
    ctx.stroke();
  }
  const s = m.r * 10;
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = Math.min(0.9, m.alpha);
  ctx.drawImage(glow(), m.x - s / 2, m.y - s / 2, s, s);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

// meteors travel left-and-down, so they enter from a band outside the
// top/right edges; a recent click pulls the band toward the line that
// passes through the click point — the storm pours out of what you chose
function spawnPoint(w, h, bias) {
  const m = 80 + Math.random() * 180;
  let x, y;
  if (Math.random() < w / (w + h)) {
    x = Math.random() * w * 1.2;
    y = -m;
  } else {
    x = w + m;
    y = Math.random() * h * 0.9 - h * 0.2;
  }
  if (bias) {
    const tTop = (bias.y + m) / DIR.y;
    const tRight = (w + m - bias.x) / -DIR.x;
    const t = Math.min(tTop, tRight);
    x += (bias.x - DIR.x * t - x) * 0.6;
    y += (bias.y - DIR.y * t - y) * 0.6;
  }
  return { x, y };
}

/* -------------------------------------------------------------- the storm */
let clickAt = null;
addEventListener(
  "pointerdown",
  (e) => {
    clickAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  },
  { capture: true, passive: true }
);

let run = null; // in-flight storm, if any

export function stormWipe(swap) {
  const node = document.getElementById("wipe");
  const canvas = document.getElementById("storm");
  // a superseding storm inherits the aborted one's veil level so the screen
  // never flashes back to full brightness mid-cover
  const carry = run ? run.abort() : 0;
  return new Promise((resolve) => {
    run = startStorm(node, canvas, swap, resolve, carry);
  });
}

function startStorm(node, canvas, swap, resolve, carryVeil = 0) {
  const ctx = canvas.getContext("2d");
  // meteors live on an offscreen layer that is redrawn clean every frame —
  // the segment trails carry the taper, so no half-erased smear can build up
  // (partial destination-out decay sticks at low alphas and reads as mud);
  // the veil stays exact on the main canvas so the reveal never muddies
  const trail = document.createElement("canvas");
  const tctx = trail.getContext("2d");

  let w, h;
  const size = () => {
    const dpr = DPR();
    w = innerWidth;
    h = innerHeight;
    for (const [c, cx] of [[canvas, ctx], [trail, tctx]]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };
  size();
  node.classList.add("in");

  const bias = clickAt && performance.now() - clickAt.t < 1500 ? clickAt : null;

  // 90 meteors on a quadratic ramp — sparse first streaks, torrential by
  // full cover — then a 20/s trickle while the screen is held black
  const times = [];
  for (let i = 0; i < 90; i++) times.push(420 * Math.cbrt((i + 1) / 90));
  let spawnIdx = 0;
  let trickleAt = 430;

  const meteors = [];
  const spawn = () => {
    meteors.push({
      ...spawnPoint(w, h, bias),
      ...jitterDir(),
      r: 1 + Math.random() * 1.6,
      speed: rng(1800, 3200),
      trail: rng(150, 250),
      alpha: rng(0.55, 1),
      fading: false,
    });
  };

  // three huge soft macro-streaks that sell the light-speed moment —
  // wide and faint, so they read as light rather than smeared gray
  const bands = [
    { at: 180, th: h * 0.2, off: -0.5 },
    { at: 260, th: h * 0.26, off: 0.35 },
    { at: 340, th: h * 0.22, off: -0.05 },
  ];
  const diag = Math.hypot(w, h);
  const bandAngle = Math.atan2(DIR.y, DIR.x);

  // faint stars that switch on inside the held black
  const warm = Array.from({ length: 5 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h * 0.6,
    r: 1 + Math.random() * 0.6,
    ph: Math.random() * 9,
  }));

  const veilAt = (t) => {
    let v;
    if (t < 140) v = 0;
    else if (t < 500) v = easeInCubic((t - 140) / 360);
    else if (t < WIPE_T.reveal) v = 1;
    else if (t < WIPE_T.reveal + 560) v = 1 - easeOutQuint((t - WIPE_T.reveal) / 560);
    else v = 0;
    // inherited darkness from an aborted run decays while this ramp takes over
    return Math.max(v, carryVeil * Math.max(0, 1 - t / 300));
  };

  const t0 = performance.now();
  let last = t0;
  let swapped = false;
  let resolved = false;
  let handed = false;
  let raf;

  // a resize mid-storm can't be remapped honestly — kill the flight cleanly
  const onResize = () => {
    size();
    meteors.length = 0;
  };
  addEventListener("resize", onResize);

  // survivors join the homepage sky mid-flight (once the veil is nearly
  // gone, so the canvas handoff is invisible); the rest fade out
  const handoff = () => {
    const live = meteors.filter(
      (m) => !m.fading && m.x > -40 && m.x < w + 40 && m.y > -40 && m.y < h + 40
    );
    if (activeSky) {
      const step = Math.max(1, Math.ceil(live.length / 56));
      for (let i = 0; i < live.length; i += step) {
        activeSky.adopt(live[i]);
        meteors.splice(meteors.indexOf(live[i]), 1);
      }
    }
    for (const m of meteors) m.fading = true;
  };

  const frame = (now) => {
    const t = now - t0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    while (spawnIdx < times.length && times[spawnIdx] <= t) {
      spawn();
      spawnIdx++;
    }
    if (t >= trickleAt && t < WIPE_T.cover + 160) {
      spawn();
      trickleAt += 50;
    }

    if (!swapped && t >= WIPE_T.cover) {
      swapped = true;
      swap();
    }
    if (!resolved && t >= WIPE_T.resolve) {
      resolved = true;
      resolve();
    }
    if (!handed && t >= 1000) {
      handed = true;
      handoff();
    }

    // physics — once the veil starts lifting, friction takes over and the
    // storm visibly arrests
    const k = t >= WIPE_T.reveal ? Math.pow(0.86, dt * 60) : 1;
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.speed *= k;
      m.x += m.dx * m.speed * dt;
      m.y += m.dy * m.speed * dt;
      if (m.fading) m.alpha -= dt / 0.3;
      if (m.alpha <= 0 || m.x < -260 || m.y > h + 260) meteors.splice(i, 1);
    }

    // trail layer: fully cleared and redrawn — crisp streaks, zero residue
    tctx.clearRect(0, 0, w, h);
    for (const m of meteors) drawMeteor(tctx, m);

    // main canvas: veil, warp bands, trails, twinkles — exact every frame
    const veil = veilAt(t);
    ctx.clearRect(0, 0, w, h);
    if (veil > 0.002) {
      ctx.fillStyle = `rgba(6,6,7,${veil.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = "lighter";
    for (const b of bands) {
      const bt = (t - b.at) / 500;
      if (bt <= 0 || bt >= 1) continue;
      const travel = easeInCubic(bt) * diag * 1.8 - diag * 0.9;
      const cx = w / 2 + DIR.x * travel - DIR.y * b.off * diag * 0.3;
      const cy = h / 2 + DIR.y * travel + DIR.x * b.off * diag * 0.3;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(bandAngle);
      const grad = ctx.createLinearGradient(0, -b.th / 2, 0, b.th / 2);
      // sin^2 envelope: eases in AND out, so the band never pops on or off
      const s = Math.sin(Math.PI * bt);
      const ba = 0.14 * s * s;
      grad.addColorStop(0, `rgba(${WHITE},0)`);
      grad.addColorStop(0.25, `rgba(${WHITE},${(ba * 0.35).toFixed(3)})`);
      grad.addColorStop(0.5, `rgba(${WHITE},${ba.toFixed(3)})`);
      grad.addColorStop(0.75, `rgba(${WHITE},${(ba * 0.35).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${WHITE},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(-diag * 0.8, -b.th / 2, diag * 1.6, b.th);
      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(trail, 0, 0, w, h);
    if (t > WIPE_T.cover && veil > 0.05) {
      for (const s of warm) {
        const a =
          Math.min(0.5, (t - WIPE_T.cover) / 400) *
          veil *
          (0.7 + 0.3 * Math.sin(t / 300 + s.ph));
        if (a <= 0) continue;
        ctx.fillStyle = `rgba(${WHITE},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 7);
        ctx.fill();
      }
    }

    if (t < WIPE_T.done) raf = requestAnimationFrame(frame);
    else cleanup(true);
  };

  const cleanup = (finish) => {
    cancelAnimationFrame(raf);
    removeEventListener("resize", onResize);
    // aborted runs keep their pixels — the replacement repaints next frame
    if (finish) {
      ctx.clearRect(0, 0, w, h);
      node.classList.remove("in");
    }
    tctx.clearRect(0, 0, w, h);
    if (finish && !swapped) {
      swapped = true;
      swap();
    }
    if (!resolved) {
      resolved = true;
      resolve();
    }
    if (finish) run = null;
  };

  raf = requestAnimationFrame(frame);
  // an aborted run is superseded — never fire its stale swap(); it reports
  // its veil level so the replacement can carry the darkness
  return {
    abort: () => {
      const v = veilAt(performance.now() - t0);
      cleanup(false);
      return v;
    },
  };
}

/* ------------------------------------------------------------------- sky */
let activeSky = null;

const LAYERS = [
  { n: 90, r: [0.5, 0.9], a: [0.1, 0.25], drift: [2, 4], par: 0 },
  { n: 40, r: [0.9, 1.5], a: [0.25, 0.5], drift: [6, 10], par: 6 },
  { n: 14, r: [1.5, 2.2], a: [0.5, 0.8], drift: [12, 18], par: 12, glow: true },
];

export function createSky(view) {
  const canvas = document.createElement("canvas");
  canvas.className = "sky";
  view.append(canvas);
  const ctx = canvas.getContext("2d");

  let w, h, vignette;
  let stars = [];
  const landing = []; // adopted storm meteors, decelerating to rest
  let ambient = null; // at most one drifting shooting star at a time
  let nextAmbient = performance.now() + rng(4000, 9000);

  const seed = () => {
    stars = [];
    const area = clamp((w * h) / (1920 * 1080), 0.35, 1.6);
    LAYERS.forEach((L, li) => {
      const n = Math.round(L.n * area);
      for (let i = 0; i < n; i++) {
        stars.push({
          layer: li,
          x: Math.random() * w,
          y: Math.random() * h,
          r: rng(...L.r),
          base: rng(...L.a),
          drift: rng(...L.drift),
          period: rng(2000, 6000),
          ph: Math.random() * 9,
        });
      }
    });
  };

  const size = () => {
    const dpr = DPR();
    w = innerWidth;
    h = innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = Math.max(w, h);
    vignette = ctx.createRadialGradient(w / 2, h / 2, R * 0.42, w / 2, h / 2, R * 0.85);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.5)");
    seed();
    ambient = null;
  };
  size();

  const drawStar = (s, t, px, py) => {
    const L = LAYERS[s.layer];
    const tw = 0.6 + 0.4 * Math.sin((t / s.period) * 2 * Math.PI + s.ph);
    const a = s.base * tw;
    const x = s.x + px * L.par;
    const y = s.y + py * L.par;
    ctx.fillStyle = `rgba(${WHITE},${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, 7);
    ctx.fill();
    if (L.glow) {
      const g = s.r * 8;
      ctx.globalAlpha = a * 0.35;
      ctx.drawImage(glow(), x - g / 2, y - g / 2, g, g);
      ctx.globalAlpha = 1;
    }
  };

  const paintStatic = () => {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) drawStar(s, s.period / 4, 0, 0);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  };

  if (reducedMotion) {
    // a single still frame — stars and vignette, nothing moves
    paintStatic();
    const onResize = () => {
      size();
      paintStatic();
    };
    addEventListener("resize", onResize);
    const api = {
      adopt() {},
      destroy() {
        removeEventListener("resize", onResize);
        canvas.remove();
        if (activeSky === api) activeSky = null;
      },
    };
    activeSky = api;
    return api;
  }

  // mid/near layers trail the cursor a few px — depth, not decoration
  const fine = matchMedia("(pointer: fine)").matches;
  let tx = 0;
  let ty = 0;
  let px = 0;
  let py = 0;
  const onMove = (e) => {
    tx = (e.clientX / w) * 2 - 1;
    ty = (e.clientY / h) * 2 - 1;
  };
  if (fine) addEventListener("pointermove", onMove, { passive: true });

  const born = performance.now();
  let last = born;
  let frameNo = 0;
  let raf;

  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    frameNo++;

    // settle to half-rate once nothing is streaking; dt is computed after
    // the skip so processed frames integrate the full elapsed interval
    const busy = landing.length || ambient || now - born < 3000;
    if (!busy && frameNo % 2) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;

    for (const s of stars) {
      s.x += DIR.x * s.drift * dt;
      s.y += DIR.y * s.drift * dt;
      if (s.x < -20) s.x += w + 40;
      else if (s.x > w + 20) s.x -= w + 40;
      if (s.y < -20) s.y += h + 40;
      else if (s.y > h + 20) s.y -= h + 40;
    }

    // adopted meteors brake until they arrest into resting stars
    const k = Math.pow(0.86, dt * 60);
    for (let i = landing.length - 1; i >= 0; i--) {
      const m = landing[i];
      m.speed *= k;
      m.x += m.dx * m.speed * dt;
      m.y += m.dy * m.speed * dt;
      if (m.speed < 40) {
        landing.splice(i, 1);
        stars.push({
          layer: m.r < 1.2 ? 0 : m.r < 1.8 ? 1 : 2,
          x: ((m.x % w) + w) % w,
          y: ((m.y % h) + h) % h,
          r: Math.min(m.r, 2.2),
          base: m.r < 1.2 ? rng(0.15, 0.25) : m.r < 1.8 ? rng(0.3, 0.5) : rng(0.5, 0.8),
          drift: rng(2, 12),
          period: rng(2000, 6000),
          ph: Math.random() * 9,
        });
      }
    }

    if (!ambient && now >= nextAmbient) {
      ambient = {
        x: rng(w * 0.25, w * 1.1),
        y: -40,
        ...jitterDir(),
        r: rng(1.1, 1.6),
        speed: 1400,
        trail: 120,
        alpha: 0.55,
      };
    }
    if (ambient) {
      ambient.x += ambient.dx * ambient.speed * dt;
      ambient.y += ambient.dy * ambient.speed * dt;
      const p = ambient.y / (h * 0.55);
      ambient.alpha = 0.55 * clamp((1.15 - p) / 0.45, 0, 1);
      if (ambient.y > h * 0.6 || ambient.x < -140 || ambient.alpha <= 0.02) {
        ambient = null;
        nextAmbient = now + rng(7000, 13000);
      }
    }

    ctx.clearRect(0, 0, w, h);
    for (const s of stars) drawStar(s, now, px, py);
    for (const m of landing) drawMeteor(ctx, m);
    if (ambient) drawMeteor(ctx, ambient);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  };

  // cancel-before-schedule keeps this idempotent: a sky created in a hidden
  // tab has a frozen pending frame, and resuming must not start a second loop
  const onVis = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener("visibilitychange", onVis);
  addEventListener("resize", size);
  if (!document.hidden) raf = requestAnimationFrame(loop);

  const api = {
    // a storm meteor continues here from the exact same pixel
    adopt(m) {
      landing.push({
        x: m.x,
        y: m.y,
        dx: m.dx,
        dy: m.dy,
        r: m.r,
        speed: m.speed,
        trail: Math.min(m.trail, 120),
        alpha: Math.min(m.alpha, 0.8),
      });
    },
    destroy() {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", onVis);
      if (fine) removeEventListener("pointermove", onMove);
      canvas.remove();
      if (activeSky === api) activeSky = null;
    },
  };
  activeSky = api;
  return api;
}
