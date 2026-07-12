// Custom cursor: a themed arrow pointer that tracks the mouse 1:1 (a real
// cursor never lags). Elements with [data-cursor] tilt/scale it, and
// [data-cursor-label] shows a small caption chip beside the arrow.
export function initCursor() {
  const fine = window.matchMedia("(pointer: fine)").matches;
  const node = document.getElementById("cursor");
  const label = document.getElementById("cursor-label");
  if (!fine) {
    node.remove();
    return;
  }
  document.documentElement.classList.add("has-cursor");

  let visible = false;
  addEventListener("pointermove", (e) => {
    if (!visible) {
      visible = true;
      node.classList.add("on");
    }
    node.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    const target = e.target.closest?.("[data-cursor]");
    node.dataset.mode = target?.dataset.cursor || "";
    const text = target?.dataset.cursorLabel || "";
    label.textContent = text;
    node.classList.toggle("lbl", !!text);
  });
  addEventListener("pointerdown", () => node.classList.add("down"));
  addEventListener("pointerup", () => node.classList.remove("down"));
  document.documentElement.addEventListener("pointerleave", () => {
    visible = false;
    node.classList.remove("on");
  });
}
