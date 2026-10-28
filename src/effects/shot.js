// Placeholder "shot": a recoil kick on the grid, then the targeted card grows
// to fill the screen. Click or Esc closes it back into the card.
export function mountShot(gridEl, grid, config) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(0.32, 0.72, 0, 1)';
  let open = null;

  gridEl.addEventListener('shoot', ({ detail }) => {
    if (open || !detail.element) return;
    const motion = !reduced.matches;
    if (motion && config.shot.recoil) {
      gridEl.animate(
        [{ transform: 'none' }, { transform: `translateY(${config.shot.recoil}px)` }, { transform: 'none' }],
        { duration: 180, easing: 'ease-out' },
      );
    }
    grid.pause(true);
    const from = detail.element.getBoundingClientRect();
    const view = document.createElement('div');
    view.className = 'shot-view';
    view.innerHTML = `
      <div class="shot-view__content">
        <p class="shot-view__eyebrow">Project ${String(detail.project).padStart(2, '0')}</p>
        <h2>Placeholder project view</h2>
        <p>This is where the project dives deeper. Click anywhere or press Esc to go back.</p>
      </div>`;
    const area = gridEl.getBoundingClientRect();
    Object.assign(view.style, {
      top: `${area.top + 24}px`,
      left: `${area.left + 24}px`,
      right: `${innerWidth - area.right + 24}px`,
      bottom: `${innerHeight - area.bottom + 24}px`,
    });
    const backdrop = document.createElement('div');
    backdrop.className = 'shot-backdrop';
    Object.assign(backdrop.style, {
      top: `${area.top}px`,
      left: `${area.left}px`,
      width: `${area.width}px`,
      height: `${area.height}px`,
    });
    document.body.append(backdrop, view);
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: motion ? 200 : 0, delay: motion ? config.shot.delay : 0, fill: 'backwards' });
    const to = view.getBoundingClientRect();
    const frames = [rectTransform(from, to), { transform: 'none', borderRadius: '12px' }];
    const duration = motion ? config.shot.zoomDuration : 0;
    view.animate(frames, { duration, delay: motion ? config.shot.delay : 0, easing: ease, fill: 'backwards' });
    view.querySelector('.shot-view__content').animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: duration * 0.5,
      delay: (motion ? config.shot.delay : 0) + duration * 0.4,
      fill: 'backwards',
    });
    open = { view, backdrop, frames, duration };
  });

  const close = () => {
    if (!open) return;
    const { view, backdrop, frames, duration } = open;
    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration * 0.8, fill: 'forwards' });
    open = null;
    view.animate([...frames].reverse(), { duration: duration * 0.8, easing: ease, fill: 'forwards' }).finished.then(() => {
      view.remove();
      backdrop.remove();
      grid.pause(false);
    });
  };
  addEventListener('keydown', (e) => e.key === 'Escape' && close());
  addEventListener('click', (e) => open && e.target.closest('.shot-view, .shot-backdrop') && close());
}

function rectTransform(from, to) {
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  return {
    transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx}, ${sy})`,
    borderRadius: `calc(var(--grid-corner-radius) * 1px / ${Math.min(sx, sy)})`,
  };
}
