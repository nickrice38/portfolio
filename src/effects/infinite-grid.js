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

  // WASD / arrow keys pan the view. W moves you up, so the grid slides down.
  const KEYS = {
    w: [0, 1], arrowup: [0, 1],
    s: [0, -1], arrowdown: [0, -1],
    a: [1, 0], arrowleft: [1, 0],
    d: [-1, 0], arrowright: [-1, 0],
  };
  const held = new Set();
  const typing = (e) => e.target.closest?.('input, textarea, select, [contenteditable]');
  addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (!KEYS[key] || typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    held.add(key);
  });
  addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
  addEventListener('blur', () => held.clear());

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const tick = () => {
    const { grid, motion } = config;

    if (held.size) {
      let kx = 0;
      let ky = 0;
      for (const key of held) {
        kx += KEYS[key][0];
        ky += KEYS[key][1];
      }
      const len = Math.hypot(kx, ky) || 1; // diagonals aren't faster
      velocity.x = (kx / len) * motion.keySpeed;
      velocity.y = (ky / len) * motion.keySpeed;
    }

    if (!drag) {
      if (!held.size) {
        const inertia = reduced.matches ? 0 : motion.inertia;
        velocity.x *= inertia;
        velocity.y *= inertia;
      }
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

    const W = el.clientWidth;
    const H = el.clientHeight;
    const { amount, axis, perspective } = config.warp;
    const warpX = axis !== 'vertical' ? bend(W / 2, amount) : null;
    const warpY = axis !== 'horizontal' ? bend(H / 2, amount) : null;
    el.style.perspective = `${perspective}px`;

    // Visible cell range in flat grid space, padded by one so cards never pop
    // in at the edges. A warp squeezes the edges, so more of the grid fits.
    const spanX = warpX?.span ?? W / 2;
    const spanY = warpY?.span ?? H / 2;
    const col0 = Math.floor((W / 2 - spanX - offset.x) / pitchX) - 1;
    const col1 = Math.ceil((W / 2 + spanX - offset.x) / pitchX);
    const row0 = Math.floor((H / 2 - spanY - offset.y) / pitchY) - 1;
    const row1 = Math.ceil((H / 2 + spanY - offset.y) / pitchY);

    let i = 0;
    for (let row = row0; row <= row1; row++) {
      // Every other row shifts sideways by rowOffset of a cell, brick-style.
      const shift = (row & 1) * grid.rowOffset * pitchX;
      for (let col = col0; col <= col1; col++) {
        // Card centre relative to the viewport centre, before warping.
        const dx = col * pitchX + shift + offset.x + w / 2 - W / 2;
        const dy = row * pitchY + offset.y + h / 2 - H / 2;
        const px = warpX ? warpX.at(dx) : { pos: dx, z: 0, angle: 0 };
        const py = warpY ? warpY.at(dy) : { pos: dy, z: 0, angle: 0 };
        if (px.hidden || py.hidden) continue;

        const card = pool[i] ?? el.appendChild(Object.assign(document.createElement('div'), { className: 'infinite-grid__card' }));
        pool[i++] = card;
        card.style.width = `${w}px`;
        card.style.height = `${h}px`;
        // One tilt about a combined axis, so corners don't twist like they
        // would with separate rotateX/rotateY.
        const tilt = Math.hypot(px.angle, py.angle);
        card.style.transform =
          `translate3d(${W / 2 + px.pos - w / 2}px, ${H / 2 + py.pos - h / 2}px, ${px.z + py.z}px) ` +
          (tilt ? `rotate3d(${py.angle}, ${-px.angle}, 0, ${tilt}rad)` : '');
        card.hidden = false;
      }
    }
    for (; i < pool.length; i++) pool[i].hidden = true;

    requestAnimationFrame(tick);
  };
  tick();
}

// Wraps a flat line of length 2*half onto a circle. amount > 0 bends it towards
// the viewer (inside of a cylinder), amount < 0 away (outside of a drum).
// At |amount| = 1 the screen edge sits a quarter turn round the circle.
function bend(half, amount) {
  if (Math.abs(amount) < 0.001) return null;
  const sign = Math.sign(amount);
  const radius = half / (Math.abs(amount) * (Math.PI / 2));
  // How much flat distance it takes to reach the screen edge (or the side of the circle).
  const limit = Math.PI * 0.45; // past this, cards are near edge-on slivers
  const span = radius * Math.min(limit, Math.asin(Math.min(1, half / radius)));
  return {
    span,
    at(d) {
      const angle = d / radius;
      if (Math.abs(angle) > limit) return { hidden: true };
      return {
        pos: radius * Math.sin(angle),
        z: sign * radius * (1 - Math.cos(angle)),
        angle: sign * angle,
      };
    },
  };
}
