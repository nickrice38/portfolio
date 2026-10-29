import { setStyle, trackRect } from './dom.js';

// A fixed crosshair at the centre of the screen. Follows the grid's current
// target to tighten and show the project name, and flashes a hitmarker on `shoot`.
export function mountCrosshair(gridEl, grid, config) {
  const el = document.createElement('div');
  el.className = 'crosshair';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    ${[0, 90, 180, 270].map((r) => `<span class="crosshair__arm" style="--r: ${r}deg"></span>`).join('')}
    ${[45, 135, 225, 315].map((r) => `<span class="crosshair__hit" style="--r: ${r}deg"></span>`).join('')}
    <span class="crosshair__dot"></span>
    <span class="crosshair__ring"></span>
    <span class="crosshair__label"></span>
  `;
  document.body.append(el);
  const label = el.querySelector('.crosshair__label');

  let shown;
  const r = trackRect(gridEl);
  const sync = () => {
    if (grid.target !== shown) {
      shown = grid.target;
      el.classList.toggle('is-on-target', !!shown);
      if (shown) label.textContent = `Project ${String(shown.project).padStart(2, '0')}`;
    }
    // Centre on the grid, which may not fill the window (e.g. beside the playground panel).
    setStyle(el, 'left', `${r.left + r.width / 2}px`);
    setStyle(el, 'top', `${r.top + r.height / 2}px`);
    if (el.dataset.style !== config.crosshair.style) el.dataset.style = config.crosshair.style;
    if (el.classList.contains('has-label') !== config.crosshair.showLabel) el.classList.toggle('has-label', config.crosshair.showLabel);
    requestAnimationFrame(sync);
  };
  sync();

  gridEl.addEventListener('shoot', () => {
    el.classList.remove('is-hit');
    void el.offsetWidth; // restart the hitmarker animation
    el.classList.add('is-hit');
  });
}
