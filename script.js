// Highlight the tab bar link that matches the current hash,
// sliding the pill behind it (adapted from transitions.dev "Tabs sliding").
const pill = document.querySelector('.tab-bar__pill');
const tabs = [...document.querySelectorAll('.tab-bar a.tab-bar__item')];

function movePill(tab, animate) {
  const place = () => {
    pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    pill.style.width = `${tab.offsetWidth}px`;
    pill.style.height = `${tab.offsetHeight}px`;
  };

  if (animate) {
    place();
    return;
  }

  // Snap into place without animating (first paint, resize)
  const prev = pill.style.transition;
  pill.style.transition = 'none';
  place();
  void pill.offsetWidth;
  pill.style.transition = prev;
}

// Pages live side by side in a snapping horizontal scroller. Tapping or
// dragging the tab bar scrolls to a page; swiping the pages moves the pill
// live and settles the tab when the scroll comes to rest.
const pager = document.querySelector('.pager');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let currentIndex = 0;
let programmaticScroll = false;
let scrollEndTimer;

const clampIndex = (i) => Math.min(Math.max(i, 0), tabs.length - 1);

function indexFromHash() {
  const hash = location.hash || '#home';
  return clampIndex(tabs.findIndex((tab) => tab.getAttribute('href') === hash));
}

function activeTab() {
  return tabs[currentIndex];
}

// Projects reveal: cards fade in, rise and untilt, staggered row by row from the top
const PROJECTS_INDEX = tabs.findIndex((tab) => tab.getAttribute('href') === '#projects');
const bento = document.querySelector('.bento');
const bentoCards = [...bento.querySelectorAll('.bento-card')];
const REVEAL_STAGGER = 110; // ms between each row
const REVEAL_DURATION = 900;
const REVEAL_AT = 0.3; // start when Projects is within 30% of a page of arriving

function revealProjects() {
  bento.dataset.revealed = 'true';
  if (reduceMotion.matches) return;
  // Top to bottom by row; the second card in a row trails slightly for a left-to-right sweep
  const rows = [...new Set(bentoCards.map((card) => card.offsetTop))].sort((a, b) => a - b);
  bentoCards.forEach((card, i) => {
    const row = rows.indexOf(card.offsetTop);
    const inRow = bentoCards.filter((c, j) => j < i && c.offsetTop === card.offsetTop).length;
    card.getAnimations().forEach((a) => a.cancel());
    card.animate(
      [
        { opacity: 0, transform: 'translateY(12px) rotate(-2deg)' },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: REVEAL_DURATION,
        delay: (row + inRow * 0.25) * REVEAL_STAGGER,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards',
      }
    );
  });
}

function markActive(index) {
  currentIndex = index;
  tabs.forEach((tab, i) => {
    if (i === index) {
      tab.setAttribute('aria-current', 'page');
    } else {
      tab.removeAttribute('aria-current');
    }
  });
}

function goTo(index, animate) {
  markActive(index);
  movePill(tabs[index], animate);

  const left = index * pager.clientWidth;
  if (Math.abs(pager.scrollLeft - left) < 1) {
    // Already in place (e.g. loading straight onto Projects): no scroll will end, so reveal now
    if (index === PROJECTS_INDEX && bento.dataset.revealed !== 'true') revealProjects();
    return;
  }

  if (animate) {
    // The pill animates itself via CSS; don't let the scroll drive it too
    programmaticScroll = true;
    pager.scrollTo({ left, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  } else {
    pager.scrollLeft = left;
  }
}

pager.addEventListener('scroll', () => {
  clearTimeout(scrollEndTimer);
  scrollEndTimer = setTimeout(onScrollEnd, 120);

  // Start the Projects reveal as the page arrives (70% of the way), not after it stops
  const distance = Math.abs(pager.scrollLeft / pager.clientWidth - PROJECTS_INDEX);
  if (distance < REVEAL_AT && bento.dataset.revealed !== 'true') revealProjects();

  if (programmaticScroll) return;

  // Swiping: position the pill between the two tabs we're travelling between
  const progress = pager.scrollLeft / pager.clientWidth;
  const i = clampIndex(Math.floor(progress));
  const from = tabs[i];
  const to = tabs[clampIndex(i + 1)];
  const x = from.offsetLeft + (to.offsetLeft - from.offsetLeft) * (progress - i);
  pill.style.transition = 'none';
  pill.style.transform = `translateX(${x}px)`;

  const nearest = clampIndex(Math.round(progress));
  if (nearest !== currentIndex) markActive(nearest);
});

function onScrollEnd() {
  programmaticScroll = false;
  const index = clampIndex(Math.round(pager.scrollLeft / pager.clientWidth));
  markActive(index);
  pill.style.transition = '';
  movePill(tabs[index], true);

  // Reveal once Projects has finished sliding in, so the motion isn't lost in the transition.
  // Once it's fully off screen, reset the cards so the next visit reveals them again.
  if (index === PROJECTS_INDEX) {
    if (bento.dataset.revealed !== 'true') revealProjects();
  } else {
    bento.dataset.revealed = 'false';
  }

  // Keep the address in sync without triggering another navigation
  const hash = tabs[index].getAttribute('href');
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

// Drag the pill across the tab bar; the tab only changes on release.
const tabBar = document.querySelector('.tab-bar');
const DRAG_THRESHOLD = 4;
let drag = null;
let suppressClick = false;

tabBar.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  suppressClick = false;
  drag ={ startX: event.clientX, moved: false };
});

tabBar.addEventListener('pointermove', (event) => {
  if (!drag) return;
  if (!drag.moved) {
    if (Math.abs(event.clientX - drag.startX) < DRAG_THRESHOLD) return;
    drag.moved = true;
    tabBar.setPointerCapture(event.pointerId);
    pill.style.transition = 'none';
  }

  // Centre the pill under the pointer, clamped to the first and last tab
  const first = tabs[0];
  const last = tabs[tabs.length - 1];
  const barLeft = tabBar.getBoundingClientRect().left + tabBar.clientLeft;
  const x = event.clientX - barLeft - pill.offsetWidth / 2;
  const clamped = Math.min(Math.max(x, first.offsetLeft), last.offsetLeft);
  pill.style.transform = `translateX(${clamped}px)`;
});

function endDrag(event) {
  if (!drag) return;
  const { moved } = drag;
  drag = null;
  if (!moved) return;

  pill.style.transition = '';
  suppressClick = true;

  if (event.type === 'pointercancel') {
    movePill(activeTab(), true);
    return;
  }

  // Land on the tab nearest the pill's centre
  const pillCentre = pill.getBoundingClientRect().left + pill.offsetWidth / 2;
  const nearest = tabs.reduce((best, tab) => {
    const rect = tab.getBoundingClientRect();
    const distance = Math.abs(rect.left + rect.width / 2 - pillCentre);
    return distance < best.distance ? { tab, distance } : best;
  }, { tab: tabs[0], distance: Infinity }).tab;

  if (nearest === activeTab()) {
    movePill(nearest, true);
  } else {
    location.hash = nearest.getAttribute('href');
  }
}

tabBar.addEventListener('pointerup', endDrag);
tabBar.addEventListener('pointercancel', endDrag);

// A drag ends with a click on whatever tab it started on; ignore it
tabBar.addEventListener('click', (event) => {
  if (suppressClick) {
    event.preventDefault();
    suppressClick = false;
  }
}, true);

// Stop the browser's native link dragging from hijacking the gesture
tabBar.addEventListener('dragstart', (event) => event.preventDefault());

// Contact button: its panel morphs out from behind it to sit above the dock
// (adapted from transitions.dev "Plus to menu morph").
// Closes on outside click, Escape, or navigation.
const menuButton = document.querySelector('.contact-button');
const contactPanel = document.querySelector('.contact-panel');
const menu = contactPanel.querySelector('.contact-panel__menu');

function setMenuOpen(open) {
  contactPanel.setAttribute('data-open', String(open));
  menuButton.setAttribute('aria-expanded', String(open));
  menu.inert = !open;
}

menuButton.addEventListener('click', () => {
  setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
});

document.addEventListener('click', (event) => {
  if (!contactPanel.contains(event.target) && !menuButton.contains(event.target)) {
    setMenuOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
    menuButton.focus();
  }
});

tabs.forEach((tab) => tab.addEventListener('click', () => setMenuOpen(false)));
pager.addEventListener('scroll', () => setMenuOpen(false), { passive: true });

window.addEventListener('hashchange', () => goTo(indexFromHash(), true));
window.addEventListener('resize', () => goTo(currentIndex, false));
bento.dataset.revealed = 'false';
requestAnimationFrame(() => goTo(indexFromHash(), false));

// Badge: centre the top label at 12 o'clock and the bottom label at 6 o'clock,
// then draw the two arcs to fill the space between them with an even gap.
const BADGE_RADIUS = 78;
const BADGE_GAP = 8; // along the circle, in SVG units

function layoutBadge(badge) {
  const top = badge.querySelector('[data-badge-label="top"]');
  const bottom = badge.querySelector('[data-badge-label="bottom"]');
  if (!top || !bottom) return;

  // Angles in degrees, clockwise from 3 o'clock (SVG's y axis points down)
  const span = (label) => (label.getComputedTextLength() / BADGE_RADIUS) * (180 / Math.PI);
  const gap = (BADGE_GAP / BADGE_RADIUS) * (180 / Math.PI);
  const topSpan = span(top);
  const bottomSpan = span(bottom);
  const topEnd = 270 + topSpan / 2;
  const topStart = 270 - topSpan / 2;
  const bottomStart = 90 - bottomSpan / 2;
  const bottomEnd = 90 + bottomSpan / 2;

  const point = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return `${(100 + BADGE_RADIUS * Math.cos(rad)).toFixed(2)} ${(100 + BADGE_RADIUS * Math.sin(rad)).toFixed(2)}`;
  };
  const arc = (from, to) => {
    const large = to - from > 180 ? 1 : 0;
    return `M ${point(from)} A ${BADGE_RADIUS} ${BADGE_RADIUS} 0 ${large} 1 ${point(to)}`;
  };

  badge.querySelector('[data-badge-arc="right"]').setAttribute('d', arc(topEnd - 360 + gap, bottomStart - gap));
  badge.querySelector('[data-badge-arc="left"]').setAttribute('d', arc(bottomEnd + gap, topStart - gap));
}

// Measure once the fonts have loaded, so the arcs fit the real text
document.fonts.ready.then(() => {
  document.querySelectorAll('.badge').forEach(layoutBadge);
});

// Project modal: grows out of the tapped bento card and shrinks back into it.
// The modal is laid out at its final size, then animated from the card's rect,
// so it reads as the card itself opening up.
const projectModal = document.querySelector('.project-modal');
const projectBackdrop = document.querySelector('.project-backdrop');
const projectClose = projectModal.querySelector('.project-modal__close');
const projectBody = projectModal.querySelector('.project-modal__body');
let openCard = null;
let modalAnimating = false;

function cssTime(name, fallback) {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

// Keyframes for position, size and colour, so the card's grey blends into the modal's white
function rectFrames(from, to, fromColour, toColour) {
  const frame = (r, backgroundColor) => ({
    top: `${r.top}px`,
    left: `${r.left}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    backgroundColor,
  });
  return [frame(from, fromColour), frame(to, toColour)];
}

const colourOf = (el) => getComputedStyle(el).backgroundColor;

function openProject(card) {
  if (openCard || modalAnimating) return;
  openCard = card;
  modalAnimating = true;

  const from = card.getBoundingClientRect();
  projectModal.hidden = false;
  projectBackdrop.hidden = false;
  const to = projectModal.getBoundingClientRect();
  card.style.visibility = 'hidden';

  const instant = reduceMotion.matches;
  const duration = instant ? 0 : cssTime('--modal-open-dur', 520);
  const easing = getComputedStyle(document.documentElement).getPropertyValue('--modal-ease').trim() || 'ease-out';

  const grow = projectModal.animate(rectFrames(from, to, colourOf(card), colourOf(projectModal)), { duration, easing });
  projectBackdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: instant ? 0 : cssTime('--modal-overlay-in', 200), easing: 'ease-out' });
  const reveal = [projectClose, projectBody].map((el) =>
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duration * 0.6, delay: duration * 0.35, easing: 'ease-out', fill: 'backwards' })
  );

  Promise.all([grow.finished, ...reveal.map((a) => a.finished)]).then(() => {
    modalAnimating = false;
    // Focus the dialog itself (not the close button) so no focus ring shows after a tap
    projectModal.focus({ preventScroll: true });
  });
}

function closeProject() {
  if (!openCard || modalAnimating) return;
  modalAnimating = true;
  const card = openCard;

  const from = projectModal.getBoundingClientRect();
  const to = card.getBoundingClientRect();
  const instant = reduceMotion.matches;
  const duration = instant ? 0 : cssTime('--modal-close-dur', 420);
  const easing = getComputedStyle(document.documentElement).getPropertyValue('--modal-ease').trim() || 'ease-out';

  [projectClose, projectBody].forEach((el) =>
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration * 0.4, easing: 'ease-in', fill: 'forwards' })
  );
  // Overlay clears quickly so it doesn't linger while the modal shrinks
  projectBackdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: instant ? 0 : cssTime('--modal-overlay-out', 150), easing: 'ease-out', fill: 'forwards' });
  const shrink = projectModal.animate(rectFrames(from, to, colourOf(projectModal), colourOf(card)), { duration, easing, fill: 'forwards' });

  shrink.finished.then(() => {
    card.style.visibility = '';
    projectModal.hidden = true;
    projectBackdrop.hidden = true;
    projectModal.getAnimations().forEach((a) => a.cancel());
    projectBackdrop.getAnimations().forEach((a) => a.cancel());
    [projectClose, projectBody].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    projectBody.scrollTop = 0;
    openCard = null;
    modalAnimating = false;
    card.focus({ preventScroll: true });
  });
}

document.querySelectorAll('.bento-card').forEach((card) => {
  card.addEventListener('click', () => openProject(card));
});
projectClose.addEventListener('click', closeProject);
projectBackdrop.addEventListener('click', closeProject);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openCard) closeProject();
});

// Avatar group hover, adapted from transitions.dev.
// Lifts the hovered avatar and its neighbours with a falloff. The timing
// function is set inline before the variables change, so hover-in eases
// cleanly and the return on mouseleave springs.
document.querySelectorAll('.t-avatar-group').forEach((group) => {
  const avatars = [...group.querySelectorAll('.t-avatar')];
  const rootStyle = getComputedStyle(document.documentElement);
  const num = (name, fallback) => {
    const value = parseFloat(rootStyle.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };
  const ease = (name, fallback) => rootStyle.getPropertyValue(name).trim() || fallback;

  function setShifts(activeIdx, phase) {
    const lift = num('--avatar-lift', -4);
    const falloff = num('--avatar-falloff', 0.45);
    const scale = num('--avatar-scale', 1.05);
    const timing = phase === 'out'
      ? ease('--avatar-ease-out', 'cubic-bezier(0.34, 3.85, 0.64, 1)')
      : ease('--avatar-ease-in', 'cubic-bezier(0.22, 1, 0.36, 1)');

    avatars.forEach((el, i) => {
      el.style.transitionTimingFunction = timing;
      if (activeIdx == null) {
        el.style.setProperty('--shift', '0px');
        el.style.setProperty('--scale-active', '1');
        return;
      }
      const distance = Math.abs(i - activeIdx);
      el.style.setProperty('--shift', `${(lift * Math.pow(falloff, distance)).toFixed(3)}px`);
      el.style.setProperty('--scale-active', i === activeIdx ? String(scale) : '1');
    });
  }

  avatars.forEach((el, i) => {
    // Stack left over right: the first avatar sits on top
    el.style.zIndex = avatars.length - i;
    el.addEventListener('mouseenter', () => setShifts(i, 'in'));
  });
  group.addEventListener('mouseleave', () => setShifts(null, 'out'));
});

// Page loader: matrix dot loader adapted from transitions.dev.
// Each dot gets a --d delay (ms) into the shared pulse; the variant is just a delay table.
const CORNERS = [0, 3, 12, 15];
const RING = [1, 2, 7, 11, 14, 13, 8, 4];
const INNER = [5, 6, 9, 10];
const TWINKLE = [7, 2, 11, 5, 14, 9, 0, 12, 3, 15, 6, 10, 13, 1, 8, 4];
const LOADER_DURATION = 3000;

const cycle = parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue('--matrix-cycle')
) || 1200;

document.querySelectorAll('.t-matrix').forEach((loader) => {
  const variant = loader.getAttribute('data-variant');
  const rounded = loader.getAttribute('data-rounded') === 'true';
  for (let idx = 0; idx < 16; idx++) {
    const dot = document.createElement('i');
    const col = idx % 4;
    if (rounded && CORNERS.includes(idx)) {
      dot.className = 'is-gap';
    } else if (variant === 'scan') {
      dot.style.setProperty('--d', String(Math.round(col * (cycle / 10))));
    } else if (variant === 'twinkle') {
      dot.style.setProperty('--d', String(Math.round(TWINKLE[idx] * (cycle / 16))));
    } else if (variant === 'orbit') {
      const k = RING.indexOf(idx);
      if (k !== -1) {
        dot.style.setProperty('--d', String(Math.round(k * (cycle / 8))));
      } else {
        dot.style.animation = 'none'; // centre holds steady under the ring
      }
    } else if (variant === 'pulse') {
      const ring = INNER.includes(idx) ? 0 : 1;
      dot.style.setProperty('--d', String(Math.round(ring * (cycle * 0.16))));
    }
    loader.appendChild(dot);
  }
});

const pageLoader = document.querySelector('.page-loader');

function finishLoading() {
  pageLoader.classList.add('is-done');
  document.querySelector('.dock').setAttribute('data-state', 'in');
}

// The loader is toggled with the `hidden` attribute in index.html
if (pageLoader.hidden) {
  finishLoading();
} else {
  setTimeout(finishLoading, LOADER_DURATION);
}
