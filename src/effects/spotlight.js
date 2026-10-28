// A soft spotlight that trails the cursor across `el`.
// Reads `config` every frame, so live edits from the playground apply immediately.
export function mountSpotlight(el, config) {
  const target = { x: el.clientWidth / 2, y: el.clientHeight / 2 };
  const pos = { ...target };

  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    target.x = e.clientX - r.left;
    target.y = e.clientY - r.top;
  });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tick = () => {
    const lag = reduced.matches ? 1 : config.hero.followLag;
    pos.x += (target.x - pos.x) * lag;
    pos.y += (target.y - pos.y) * lag;
    el.style.setProperty('--spot-x', `${pos.x}px`);
    el.style.setProperty('--spot-y', `${pos.y}px`);
    el.classList.toggle('has-spotlight', config.hero.spotlightEnabled);
    requestAnimationFrame(tick);
  };
  tick();
}
