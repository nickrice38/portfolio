// An endless, pannable grid of cards. Only the cards in view exist in the DOM;
// they are pooled and repositioned as the grid moves.
// Reads `config` every frame, so live edits from the playground apply immediately.
export function mountInfiniteGrid(el, config) {
  el.classList.add('infinite-grid');
  const pool = [];
  const offset = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 };
  let drag = null;

  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
    drag = { x: e.clientX, y: e.clientY };
    velocity.x = velocity.y = 0;
  });

  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const speed = config.motion.dragSpeed;
    velocity.x = (e.clientX - drag.x) * speed;
    velocity.y = (e.clientY - drag.y) * speed;
    offset.x += velocity.x;
    offset.y += velocity.y;
    drag = { x: e.clientX, y: e.clientY };
  });

  const endDrag = () => {
    drag = null;
    el.classList.remove('is-dragging');
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);

  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const speed = config.motion.wheelSpeed;
      offset.x -= e.deltaX * speed;
      offset.y -= e.deltaY * speed;
      velocity.x = velocity.y = 0;
    },
    { passive: false },
  );

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const tick = () => {
    const { grid, motion } = config;

    if (!drag) {
      const inertia = reduced.matches ? 0 : motion.inertia;
      velocity.x *= inertia;
      velocity.y *= inertia;
      offset.x += velocity.x;
      offset.y += velocity.y;
      if (!reduced.matches) {
        offset.x += motion.driftX;
        offset.y += motion.driftY;
      }
    }

    const w = grid.cardWidth * grid.zoom;
    const h = w / grid.aspectRatio;
    const pitchX = w + grid.gapX * grid.zoom;
    const pitchY = h + grid.gapY * grid.zoom;

    // Visible cell range, padded by one so cards never pop in at the edges.
    const col0 = Math.floor(-offset.x / pitchX) - 1;
    const col1 = Math.ceil((el.clientWidth - offset.x) / pitchX);
    const row0 = Math.floor(-offset.y / pitchY) - 1;
    const row1 = Math.ceil((el.clientHeight - offset.y) / pitchY);

    let i = 0;
    for (let row = row0; row <= row1; row++) {
      // Every other row shifts sideways by rowOffset of a cell, brick-style.
      const shift = (row & 1) * grid.rowOffset * pitchX;
      for (let col = col0; col <= col1; col++) {
        const card = pool[i] ?? el.appendChild(Object.assign(document.createElement('div'), { className: 'infinite-grid__card' }));
        pool[i++] = card;
        card.style.width = `${w}px`;
        card.style.height = `${h}px`;
        card.style.transform = `translate3d(${col * pitchX + shift + offset.x}px, ${row * pitchY + offset.y}px, 0)`;
        card.hidden = false;
      }
    }
    for (; i < pool.length; i++) pool[i].hidden = true;

    requestAnimationFrame(tick);
  };
  tick();
}
