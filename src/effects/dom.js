// Small helpers for code that runs every frame.

// Set a style property only when its value changes. Re-writing the same
// value still makes the browser recalculate styles, which adds up per frame.
export function setStyle(el, prop, value) {
  const cache = (el._styles ??= {});
  if (cache[prop] === value) return;
  cache[prop] = value;
  if (prop.startsWith('--')) el.style.setProperty(prop, value);
  else el.style[prop] = value;
}

// An element's on-screen box, kept up to date by observers instead of being
// measured every frame (measuring after a style change forces a layout).
export function trackRect(el) {
  const rect = { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
  const measure = () => {
    const r = el.getBoundingClientRect();
    Object.assign(rect, { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom });
  };
  measure();
  new ResizeObserver(measure).observe(el);
  addEventListener('resize', measure);
  return rect;
}
