// Inline mono icon set — stroke follows currentColor so icons theme for free.
const svg = (body, vb = "0 0 24 24") =>
  `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  heart: svg(
    `<path d="M12 20.5 4.6 13a4.8 4.8 0 0 1 0-6.9 4.9 4.9 0 0 1 7 0l.4.5.4-.5a4.9 4.9 0 0 1 7 0 4.8 4.8 0 0 1 0 6.9L12 20.5Z"/>`
  ),
  comment: svg(
    `<path d="M21 12a8.5 8.5 0 0 1-8.5 8.5 8.9 8.9 0 0 1-3.4-.7L3.5 21l1.3-4.9A8.5 8.5 0 1 1 21 12Z"/>`
  ),
  share: svg(`<path d="M13 5.5 20 12l-7 6.5v-4C7 14.5 4.5 16.5 3.5 19c0-6 3.5-9.5 9.5-9.5v-4Z"/>`),
  bookmark: svg(`<path d="M7 3.5h10a1 1 0 0 1 1 1v16L12 16l-6 4.5v-16a1 1 0 0 1 1-1Z"/>`),
  play: svg(`<path d="M8 5.5v13l11-6.5L8 5.5Z"/>`),
  pause: svg(`<path d="M8 5v14M16 5v14"/>`),
  eye: svg(`<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>`),
  soundOn: svg(
    `<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>`
  ),
  soundOff: svg(`<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z"/><path d="m16 9.5 5 5m0-5-5 5"/>`),
  rotate: svg(
    `<rect x="7.5" y="3.5" width="9" height="17" rx="2"/><path d="M20.5 8.5a9 9 0 0 1 1 4M3.5 15.5a9 9 0 0 1-1-4"/><path d="m21.9 10.6-.4 2.3-2.2-.9M2.1 13.4l.4-2.3 2.2.9"/>`
  ),
  arrowLeft: svg(`<path d="M19 12H5m6-7-7 7 7 7"/>`),
  arrowUp: svg(`<path d="M12 19V5m-7 6 7-7 7 7"/>`),
  lock: svg(`<rect x="5.5" y="10.5" width="13" height="9" rx="1.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>`),
  plus: svg(`<path d="M12 5v14M5 12h14"/>`),
  notes: svg(`<path d="M6 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"/><path d="M8.5 8h7m-7 4h7m-7 4h4"/>`),
  chart: svg(`<path d="M4 20V10m5.5 10V4M15 20v-8m5.5 8V7"/>`),
  vertical: svg(`<rect x="8" y="4" width="8" height="16" rx="1.5"/>`),
  horizontal: svg(`<rect x="4" y="8" width="16" height="8" rx="1.5"/>`),
  check: svg(`<path d="m5 12.5 4.5 4.5L19 7.5"/>`),
  expand: svg(
    `<path d="M9 3.5H3.5V9M15 3.5h5.5V9M9 20.5H3.5V15M15 20.5h5.5V15"/>`
  ),
  collapse: svg(
    `<path d="M3.5 9H9V3.5M20.5 9H15V3.5M3.5 15H9v5.5M20.5 15H15v5.5"/>`
  ),
};
