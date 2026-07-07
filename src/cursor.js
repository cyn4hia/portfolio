// Custom two-part cursor: an instant dot plus a lagging ring.
// Elements with [data-cursor] change its state; [data-cursor-label] adds text.
export function initCursor() {
  const fine = window.matchMedia("(pointer: fine)").matches;
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  const label = document.getElementById("cursor-label");
  if (!fine) {
    dot.remove();
    ring.remove();
    return;
  }
  document.documentElement.classList.add("has-cursor");

  let x = innerWidth / 2,
    y = innerHeight / 2,
    rx = x,
    ry = y,
    visible = false;

  addEventListener("pointermove", (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!visible) {
      visible = true;
      dot.classList.add("on");
      ring.classList.add("on");
    }
    const target = e.target.closest("[data-cursor]");
    const mode = target?.dataset.cursor || "";
    ring.dataset.mode = mode;
    label.textContent = target?.dataset.cursorLabel || "";
  });
  addEventListener("pointerdown", () => ring.classList.add("down"));
  addEventListener("pointerup", () => ring.classList.remove("down"));
  document.documentElement.addEventListener("pointerleave", () => {
    visible = false;
    dot.classList.remove("on");
    ring.classList.remove("on");
  });

  (function loop() {
    rx += (x - rx) * 0.16;
    ry += (y - ry) * 0.16;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  })();
}
