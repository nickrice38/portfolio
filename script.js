// Highlight the tab bar link that matches the current hash,
// sliding the pill behind it (adapted from transitions.dev "Tabs sliding").
const pill = document.querySelector('.tab-bar__pill');
const tabs = [...document.querySelectorAll('.tab-bar a')];

function activeTab() {
  const hash = location.hash || '#home';
  return tabs.find((tab) => tab.getAttribute('href') === hash) || tabs[0];
}

function movePill(tab, animate) {
  const place = () => {
    pill.style.transform = `translate(${tab.offsetLeft}px, ${tab.offsetTop}px)`;
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

function setActiveTab(animate) {
  const current = activeTab();
  tabs.forEach((tab) => {
    if (tab === current) {
      tab.setAttribute('aria-current', 'page');
    } else {
      tab.removeAttribute('aria-current');
    }
  });
  movePill(current, animate);
  showView(current.getAttribute('href').slice(1));
}

// Show only the view whose id matches the active tab
function showView(id) {
  document.querySelectorAll('.view').forEach((view) => {
    view.hidden = view.id !== id;
  });
  window.scrollTo(0, 0);
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
  pill.style.transform = `translate(${clamped}px, ${first.offsetTop}px)`;
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

window.addEventListener('hashchange', () => setActiveTab(true));
window.addEventListener('resize', () => movePill(activeTab(), false));
requestAnimationFrame(() => setActiveTab(false));

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
  document.querySelector('.tab-bar').setAttribute('data-state', 'in');
}

// The loader is toggled with the `hidden` attribute in index.html
if (pageLoader.hidden) {
  finishLoading();
} else {
  setTimeout(finishLoading, LOADER_DURATION);
}
