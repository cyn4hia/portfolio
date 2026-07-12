export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// 102400 -> "102.4K", 1240 -> "1.2K", 312 -> "312"
export function fmt(n) {
  if (n >= 1_000_000) return trim(n / 1_000_000) + "M";
  if (n >= 1_000) return trim(n / 1_000) + "K";
  return String(n);
}
const trim = (v) => (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10).toString();

// Loose display for stats that drift: rounds DOWN to a clean half-step and
// appends "+", so 102400 -> "100K+", 68400 -> "65K+", 1240 -> "1K+".
export function fmtApprox(n) {
  if (n <= 0) return "0";
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  const step = mag / 2;
  return fmt(Math.floor(n / step) * step) + "+";
}

// Animates a number counting up inside `node`. Returns a cancel function.
export function countUp(node, target, { duration = 900, format = fmt } = {}) {
  if (reducedMotion || target === 0) {
    node.textContent = format(target);
    return () => {};
  }
  const start = performance.now();
  let raf;
  const tick = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = format(Math.round(target * eased));
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

// Types `text` into `node` character by character. Returns a cancel function.
export function typeText(node, text, { speed = 28 } = {}) {
  if (reducedMotion) {
    node.textContent = text;
    return () => {};
  }
  node.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    node.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(timer);
  }, speed);
  return () => {
    clearInterval(timer);
    node.textContent = text;
  };
}

// GitHub Pages serves the site from a sub-path, so asset URLs must stay
// relative — tolerate a leading "/" in the data file
export const assetUrl = (p) => p.replace(/^\//, "");

export function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })
    .toLowerCase();
}

export const pad2 = (n) => String(n).padStart(2, "0");
