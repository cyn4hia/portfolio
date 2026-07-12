import { reducedMotion, typeText } from "./utils.js";
import { getAccount } from "./data/accounts.js";
import { stormWipe, WIPE_T } from "./stars.js";

// The transition is a meteor storm (drawn by stars.js): shooting stars streak
// in and smear into a black sky, the view swaps under it, and as the sky lifts
// the surviving meteors decelerate and land as the homepage's resting stars.
// While the screen is held black, a terminal slate types the destination.

let slateTimers = [];
let slateCancel = null;

function destination() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "a" && parts[1]) {
    const acc = getAccount(parts[1]);
    if (acc) return `-> /${acc.handle.replace("@", "")}`;
  }
  return "-> /home";
}

export function wipe(swap) {
  if (reducedMotion) {
    swap();
    return Promise.resolve();
  }
  const slate = document.getElementById("wipe-slate");
  slateTimers.splice(0).forEach(clearTimeout);
  if (slateCancel) slateCancel();
  slate.classList.remove("show");
  slate.textContent = "";
  slateTimers.push(
    setTimeout(() => {
      slate.classList.add("show");
      slateCancel = typeText(slate, destination(), { speed: 16 });
    }, WIPE_T.cover),
    setTimeout(() => slate.classList.remove("show"), WIPE_T.reveal)
  );
  return stormWipe(swap);
}
