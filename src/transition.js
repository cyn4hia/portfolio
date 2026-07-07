import { reducedMotion } from "./utils.js";

// Three staggered panels sweep down to cover the screen, the view swaps
// underneath, then the panels continue off the bottom.
export function wipe(swap) {
  const node = document.getElementById("wipe");
  if (reducedMotion) {
    swap();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    node.classList.remove("out");
    node.classList.add("in");
    setTimeout(() => {
      swap();
      node.classList.add("out");
      setTimeout(() => {
        node.classList.remove("in", "out");
        resolve();
      }, 620);
    }, 560);
  });
}
