import { setStyle, trackRect } from './dom.js';

// A game-style pause menu shown in the hole the grid clears. Play closes the
// hole and hands control to the grid; Esc (or losing pointer lock) brings it back.
export function mountPauseMenu(gridEl, grid, config, items) {
  const menu = document.createElement('nav');
  menu.className = 'pause-menu';
  menu.setAttribute('aria-label', 'Main menu');
  menu.innerHTML = `
    <p class="pause-menu__eyebrow">Nick Rice</p>
    <ul class="pause-menu__list">
      ${items.map((item, i) => `<li><button type="button" data-index="${i}">${item.label}</button></li>`).join('')}
    </ul>
    <p class="pause-menu__hint"><kbd>↑</kbd><kbd>↓</kbd> Select <kbd>↵</kbd> Confirm</p>
  `;
  const hud = document.createElement('p');
  hud.className = 'pause-hud';
  hud.innerHTML = '<kbd>Esc</kbd> Menu';
  document.body.append(menu, hud);
  const buttons = [...menu.querySelectorAll('button')];

  let open = true;
  let selected = 0;
  let resumeTimer;

  const select = (i) => {
    selected = (i + buttons.length) % buttons.length;
    buttons.forEach((b, j) => b.classList.toggle('is-selected', j === selected));
  };

  const show = () => {
    clearTimeout(resumeTimer);
    open = true;
    grid.pause(true);
    grid.setHole(true);
    document.body.classList.add('is-menu-open');
    select(0);
    // Let the cards clear before the menu appears.
    menu.style.transitionDelay = `${config.home.transition * 0.45}ms`;
    menu.classList.add('is-open');
  };

  const play = () => {
    open = false;
    menu.style.transitionDelay = '0ms';
    menu.classList.remove('is-open');
    document.body.classList.remove('is-menu-open');
    grid.setHole(false);
    // Hand over control once the cards have mostly filled back in.
    resumeTimer = setTimeout(() => grid.pause(false), config.home.transition * 0.6);
  };

  const activate = (i) => {
    const item = items[i];
    if (item.action === 'play') return play();
    // Placeholder: flag it as coming soon.
    buttons[i].dataset.soon = '';
    setTimeout(() => delete buttons[i].dataset.soon, 1200);
  };

  menu.addEventListener('pointerover', (e) => {
    const b = e.target.closest('button');
    if (b) select(+b.dataset.index);
  });
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) activate(+b.dataset.index);
  });

  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (document.querySelector('.shot-view')) return; // Esc there closes the project
    const key = e.key.toLowerCase();
    if (key === 'escape') return open ? play() : show();
    if (!open) return;
    if (key === 'arrowup' || key === 'w') select(selected - 1);
    else if (key === 'arrowdown' || key === 's') select(selected + 1);
    else if (key === 'enter' || key === ' ') activate(selected);
    else return;
    e.preventDefault();
  });

  // Mouse look: Esc releases the pointer before we see the key, so treat the release as pause.
  gridEl.addEventListener('unlock', () => !open && show());

  // Keep the menu sized to the hole and sitting in it, wherever it is on screen.
  const r = trackRect(gridEl);
  const sync = () => {
    const hole = grid.holeRect;
    setStyle(menu, 'left', `${r.left + hole.x + hole.width / 2}px`);
    setStyle(menu, 'top', `${r.top + hole.y + hole.height / 2}px`);
    setStyle(menu, 'width', `${hole.width}px`);
    setStyle(menu, 'height', `${hole.height}px`);
    setStyle(hud, 'right', `${innerWidth - r.right + 24}px`);
    setStyle(hud, 'top', `${r.top + 24}px`);
    requestAnimationFrame(sync);
  };
  sync();

  // Start on the menu.
  grid.pause(true);
  document.body.classList.add('is-menu-open');
  select(0);
  menu.classList.add('is-open');

  return { show, play };
}
