// An endless, pannable grid of cards. Only the cards in view exist in the DOM;
// they are pooled and repositioned as the grid moves.
// Reads `config` every frame, so live edits from the playground apply immediately.
//
// The card under the centre of the screen is the target (exposed as `.target`).
// The grid fires a `shoot` event on `el` when the target is clicked.
export function mountInfiniteGrid(el, config) {
  el.classList.add('infinite-grid');
  const pool = [];
  const offset = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 };
  const lifts = new Map(); // "col,row" -> 0..1, eased per frame
  let drag = null;
  let lastInput = 0;
  let target = null;
  let paused = false;
  // The hole: a block of cells cleared for the menu. `origin` is its top-left
  // cell, `open` animates 0 (cards in place) to 1 (cards gone).
  const hole = { origin: null, open: 1, from: 1, to: 1, start: 0 };

  let aimAt = null; // mouse position relative to the centre, for joystick mode
  const locked = () => document.pointerLockElement === el;

  const touched = () => (lastInput = performance.now());
  // Aim assist slowdown: input moves the grid less while a card is targeted.
  const sticky = () => (target ? 1 - config.aim.stickiness : 1);

  el.addEventListener('pointerdown', (e) => {
    if (paused) return;
    // Mouse look: every press while locked is a shot, no dragging.
    if (locked()) {
      if (target) el.dispatchEvent(new CustomEvent('shoot', { detail: target }));
      return;
    }
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
    drag = { x: e.clientX, y: e.clientY, travel: 0 };
    velocity.x = velocity.y = 0;
    touched();
  });

  el.addEventListener('pointermove', (e) => {
    if (locked()) {
      if (paused) return;
      const speed = config.control.lookSensitivity * sticky();
      velocity.x = -e.movementX * speed;
      velocity.y = -e.movementY * speed;
      offset.x += velocity.x;
      offset.y += velocity.y;
      touched();
      return;
    }
    if (e.pointerType === 'mouse') {
      const r = el.getBoundingClientRect();
      aimAt = { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
    }
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const speed = config.motion.dragSpeed * sticky();
    velocity.x = dx * speed;
    velocity.y = dy * speed;
    offset.x += velocity.x;
    offset.y += velocity.y;
    drag = { x: e.clientX, y: e.clientY, travel: drag.travel + Math.hypot(dx, dy) };
    touched();
  });

  const endDrag = (e) => {
    if (!drag) return;
    const clicked = e.type === 'pointerup' && drag.travel < 4;
    drag = null;
    el.classList.remove('is-dragging');
    if (clicked && config.control.mode === 'look' && e.pointerType === 'mouse') {
      // First click in mouse look mode grabs the pointer instead of shooting.
      el.requestPointerLock();
    } else if (clicked && target) {
      velocity.x = velocity.y = 0;
      el.dispatchEvent(new CustomEvent('shoot', { detail: target }));
    }
  };
  el.addEventListener('pointerleave', () => (aimAt = null));
  document.addEventListener('pointerlockchange', () => {
    el.classList.toggle('is-locked', locked());
    // Losing the pointer lock outside a shot (usually Esc) means pause, like a game.
    if (!locked() && !paused) el.dispatchEvent(new CustomEvent('unlock'));
  });
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);

  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      if (paused) return;
      const speed = config.motion.wheelSpeed * sticky();
      offset.x -= e.deltaX * speed;
      offset.y -= e.deltaY * speed;
      velocity.x = velocity.y = 0;
      touched();
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
    if (paused || typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((key === ' ' || key === 'enter') && target) {
      e.preventDefault();
      el.dispatchEvent(new CustomEvent('shoot', { detail: target }));
      return;
    }
    if (!KEYS[key]) return;
    e.preventDefault();
    held.add(key);
  });
  addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
  addEventListener('blur', () => held.clear());

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const tick = () => {
    const { grid, motion, aim } = config;

    if (held.size && !paused) {
      let kx = 0;
      let ky = 0;
      for (const key of held) {
        kx += KEYS[key][0];
        ky += KEYS[key][1];
      }
      const len = Math.hypot(kx, ky) || 1; // diagonals aren't faster
      velocity.x = (kx / len) * motion.keySpeed * sticky();
      velocity.y = (ky / len) * motion.keySpeed * sticky();
      touched();
    }

    // Joystick: distance from the centre sets speed, past a dead zone.
    el.dataset.control = config.control.mode;
    const radius = Math.min(el.clientWidth, el.clientHeight) / 2;
    el.classList.toggle('show-dead-zone', config.control.showDeadZone);
    el.style.setProperty('--dead-zone', `${config.control.deadZone * radius * 2}px`);
    if (config.control.mode === 'joystick' && aimAt && !drag && !held.size && !paused) {
      const { deadZone, maxSpeed, curve } = config.control;
      const dist = Math.min(1, Math.hypot(aimAt.x, aimAt.y) / radius);
      if (dist > deadZone) {
        const t = ((dist - deadZone) / (1 - deadZone)) ** curve;
        const len = Math.hypot(aimAt.x, aimAt.y);
        velocity.x = (-aimAt.x / len) * maxSpeed * t * sticky();
        velocity.y = (-aimAt.y / len) * maxSpeed * t * sticky();
        touched();
      }
    }

    if (!drag) {
      if (!held.size) {
        const inertia = reduced.matches ? 0 : motion.inertia;
        velocity.x *= inertia;
        velocity.y *= inertia;
      }
      offset.x += velocity.x;
      offset.y += velocity.y;
      if (!reduced.matches && !paused) {
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
    const shiftOf = (row) => (row & 1) * grid.rowOffset * pitchX;

    // The hole: cells cleared for the menu, eased open and closed over time.
    const { cols, rows, transition, stagger } = config.home;
    const now = performance.now();
    const ease = (t) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
    const holeW = cols * pitchX - (pitchX - w);
    const holeH = rows * pitchY - (pitchY - h);
    if (!hole.origin) {
      // First frame: hole at the middle of the grid, already open and centred.
      hole.origin = { col: -Math.floor(cols / 2), row: -Math.floor(rows / 2) };
      offset.x = W / 2 - (hole.origin.col * pitchX + holeW / 2);
      offset.y = H / 2 - (hole.origin.row * pitchY + holeH / 2);
    }
    hole.open = hole.from + (hole.to - hole.from) * ease((now - hole.start) / transition);
    const holeActive = hole.open > 0.001 && cols > 0 && rows > 0;
    const inHole = (col, row) =>
      holeActive && col >= hole.origin.col && col < hole.origin.col + cols && row >= hole.origin.row && row < hole.origin.row + rows;
    // 0..1 visibility for a hole card. Cards nearest the middle leave first and return last.
    const presence = (col, row) => {
      const cx = (col - hole.origin.col + 0.5) / cols - 0.5;
      const cy = (row - hole.origin.row + 0.5) / rows - 0.5;
      const d = Math.min(1, Math.hypot(cx, cy) * Math.SQRT2); // 0 centre .. 1 corner
      return Math.min(1, Math.max(0, (1 - hole.open) * (1 + stagger) - (1 - d) * stagger));
    };
    // Where the hole sits on screen, relative to the grid's top-left.
    holeRect = {
      x: offset.x + hole.origin.col * pitchX,
      y: offset.y + hole.origin.row * pitchY,
      width: holeW,
      height: holeH,
    };

    // Nearest card to the centre of the screen, in flat grid space.
    const nearRow = Math.round((H / 2 - offset.y - h / 2) / pitchY);
    const nearCol = Math.round((W / 2 - offset.x - shiftOf(nearRow) - w / 2) / pitchX);
    const nearDx = nearCol * pitchX + shiftOf(nearRow) + offset.x + w / 2 - W / 2;
    const nearDy = nearRow * pitchY + offset.y + h / 2 - H / 2;
    const nearIsHome = inHole(nearCol, nearRow);
    const onCard = !nearIsHome && Math.abs(nearDx) <= w / 2 && Math.abs(nearDy) <= h / 2;

    // Settle: once things are still, ease the nearest card under the crosshair.
    const still = !drag && !held.size && Math.hypot(velocity.x, velocity.y) < 0.5;
    if (still && !paused && !holeActive && aim.settle > 0 && performance.now() - lastInput > aim.settleDelay) {
      offset.x -= nearDx * aim.settle;
      offset.y -= nearDy * aim.settle;
      velocity.x = velocity.y = 0;
    }

    const key = onCard ? `${nearCol},${nearRow}` : null;
    if (key !== target?.key) {
      target = key && { key, col: nearCol, row: nearRow, project: projectAt(nearCol, nearRow, grid.projectCount) };
    }
    if (target) lifts.set(target.key, lifts.get(target.key) ?? 0);
    for (const [k, v] of lifts) {
      const next = v + ((k === target?.key ? 1 : 0) - v) * (reduced.matches ? 1 : 0.2);
      if (next < 0.001 && k !== target?.key) lifts.delete(k);
      else lifts.set(k, next);
    }

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
      const shift = shiftOf(row);
      for (let col = col0; col <= col1; col++) {
        // Card centre relative to the viewport centre, before warping.
        const dx = col * pitchX + shift + offset.x + w / 2 - W / 2;
        const dy = row * pitchY + offset.y + h / 2 - H / 2;
        const px = warpX ? warpX.at(dx) : { pos: dx, z: 0, angle: 0 };
        const py = warpY ? warpY.at(dy) : { pos: dy, z: 0, angle: 0 };
        const shown = inHole(col, row) ? presence(col, row) : 1;
        if (px.hidden || py.hidden || shown <= 0) continue;

        const card = pool[i] ?? el.appendChild(Object.assign(document.createElement('div'), { className: 'infinite-grid__card' }));
        pool[i++] = card;
        const cellKey = `${col},${row}`;
        const lift = lifts.get(cellKey) ?? 0;
        const scale = (1 + lift * (aim.liftScale - 1)) * (0.6 + 0.4 * shown);
        // One tilt about a combined axis, so corners don't twist like they
        // would with separate rotateX/rotateY.
        const tilt = Math.hypot(px.angle, py.angle);
        card.style.width = `${w}px`;
        card.style.height = `${h}px`;
        card.style.transform =
          `translate3d(${W / 2 + px.pos - w / 2}px, ${H / 2 + py.pos - h / 2}px, ${px.z + py.z}px) ` +
          (tilt ? `rotate3d(${py.angle}, ${-px.angle}, 0, ${tilt}rad) ` : '') +
          `scale(${scale})`;
        card.style.setProperty('--lift', lift);
        card.style.opacity = shown;
        card.classList.toggle('is-target', cellKey === target?.key);
        if (cellKey === target?.key) target.element = card;
        card.hidden = false;
      }
    }
    for (; i < pool.length; i++) pool[i].hidden = true;

    requestAnimationFrame(tick);
  };
  let holeRect = { x: 0, y: 0, width: 0, height: 0 };
  tick();

  return {
    // Clear the block of cards closest to the crosshair, or fill it back in.
    // The view doesn't move; the menu follows the hole wherever it lands.
    setHole(open) {
      const { cols, rows } = config.home;
      const now = performance.now();
      if (open) {
        const g = config.grid;
        const w = g.cardWidth * g.zoom;
        const h = w / g.aspectRatio;
        const pitchX = w + g.gapX * g.zoom;
        const pitchY = h + g.gapY * g.zoom;
        const holeW = cols * pitchX - (pitchX - w);
        const holeH = rows * pitchY - (pitchY - h);
        // Grid-space point under the crosshair; pick the block of cells centred nearest it.
        const gx = el.clientWidth / 2 - offset.x;
        const gy = el.clientHeight / 2 - offset.y;
        hole.origin = { col: Math.round((gx - holeW / 2) / pitchX), row: Math.round((gy - holeH / 2) / pitchY) };
      }
      hole.from = hole.open;
      hole.to = open ? 1 : 0;
      hole.start = now;
      velocity.x = velocity.y = 0;
    },
    get holeRect() {
      return holeRect;
    },
    pause: (value) => {
      paused = value;
      if (value && locked()) document.exitPointerLock();
      held.clear();
      velocity.x = velocity.y = 0;
    },
    get target() {
      return target;
    },
  };
}

// Projects repeat across the endless grid in a scattered pattern, so
// neighbouring cards are never the same project. Returns 1..count.
function projectAt(col, row, count) {
  return ((((col * 7 + row * 3) % count) + count) % count) + 1;
}

// Wraps a flat line of length 2*half onto a circle. amount > 0 bends it towards
// the viewer (inside of a cylinder), amount < 0 away (outside of a drum).
// At |amount| = 1 the screen edge sits a quarter turn round the circle.
function bend(half, amount) {
  if (Math.abs(amount) < 0.001) return null;
  const sign = Math.sign(amount);
  const radius = half / (Math.abs(amount) * (Math.PI / 2));
  const limit = Math.PI * 0.45; // past this, cards are near edge-on slivers
  // How much flat distance it takes to reach the screen edge (or the side of the circle).
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
