// Game HUD fed by the score pop-up's `score` events: a running score and
// projects counter (top left), a kill feed (bottom left) and streak medals
// when you've seen 3, 5 and 10 different projects.
const MEDALS = {
  3: ['3 project streak', 'Hat trick'],
  5: ['5 project streak', 'On a roll'],
  10: ['10 project streak', "Recruiter's delight"],
};

export function mountHud(gridEl, config) {
  const counter = document.createElement('div');
  counter.className = 'hud-counter';
  counter.innerHTML = `
    <span class="hud-counter__label">Score</span>
    <span class="hud-counter__score">0</span>
    <span class="hud-counter__projects"></span>`;
  const feed = document.createElement('ol');
  feed.className = 'hud-feed';
  const medal = document.createElement('div');
  medal.className = 'hud-medal';
  medal.innerHTML = '<span class="hud-medal__eyebrow"></span><span class="hud-medal__title"></span>';
  const edges = ['top', 'bottom'].map(progressiveBlur);
  for (const el of [counter, feed, medal, ...edges]) el.setAttribute('aria-hidden', 'true');
  document.body.append(...edges, counter, feed, medal);

  const scoreEl = counter.querySelector('.hud-counter__score');
  const projectsEl = counter.querySelector('.hud-counter__projects');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let shown = 0; // score currently displayed, ticks towards the real total
  let total = 0;
  let seen = 0;
  const pad = (n) => String(n).padStart(2, '0');
  const showProjects = () => (projectsEl.textContent = `Projects ${pad(seen)} / ${pad(config.grid.projectCount)}`);
  showProjects();

  gridEl.addEventListener('score', ({ detail }) => {
    total = detail.total;
    if (detail.reset) {
      seen = 0;
      shown = 0;
      feed.replaceChildren();
      showProjects();
      return;
    }
    const before = seen;
    seen = detail.seen;
    showProjects();
    addFeedLine(detail);
    if (config.hud.medals && seen > before && MEDALS[seen]) showMedal(...MEDALS[seen]);
  });

  function addFeedLine({ project, earned, preview }) {
    if (!config.hud.feed) return;
    const line = document.createElement('li');
    const name = Object.assign(document.createElement('span'), { className: 'hud-feed__name', textContent: config.hud.feedName });
    const what = Object.assign(document.createElement('span'), {
      textContent: preview ? 'Preview' : `Project ${pad(project)}`,
    });
    const pts = Object.assign(document.createElement('span'), { className: 'hud-feed__points', textContent: `+${earned}` });
    line.append(name, crosshairIcon(), what, pts);
    feed.append(line); // newest at the bottom, like a game kill feed
    while (feed.children.length > config.hud.feedMax) feed.firstChild.remove();
    const fade = line.animate(
      [{ opacity: 1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }],
      { duration: config.hud.feedHold, fill: 'forwards' },
    );
    fade.finished.then(() => line.remove()).catch(() => {});
    if (!reduced.matches) line.animate([{ transform: 'translateX(-16px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
  }

  function showMedal(eyebrow, title) {
    medal.querySelector('.hud-medal__eyebrow').textContent = eyebrow;
    medal.querySelector('.hud-medal__title').textContent = title;
    medal.getAnimations().forEach((a) => a.cancel());
    const hold = config.hud.medalHold;
    const base = 'translateX(-50%)';
    medal.animate(
      reduced.matches
        ? [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }]
        : [
            { opacity: 0, transform: `${base} translateY(-24px) scale(1.1)` },
            { opacity: 1, transform: `${base} translateY(0) scale(1)`, offset: 0.1 },
            { opacity: 1, transform: `${base} translateY(0) scale(1)`, offset: 0.9 },
            { opacity: 0, transform: `${base} translateY(-12px)` },
          ],
      { duration: hold, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    );
  }

  // Follow the grid's edges (it may not fill the window), and tick the score up.
  const sync = () => {
    const r = gridEl.getBoundingClientRect();
    counter.style.left = `${r.left + 24}px`;
    counter.style.top = `${r.top + 24}px`;
    feed.style.left = `${r.left + 24}px`;
    feed.style.bottom = `${innerHeight - r.bottom + 24}px`;
    medal.style.left = `${r.left + r.width / 2}px`;
    medal.style.top = `${r.top + 72}px`;
    for (const edge of edges) {
      edge.hidden = !config.hud.edgeBlur;
      edge.style.left = `${r.left}px`;
      edge.style.width = `${r.width}px`;
    }
    edges[0].style.top = `${r.top}px`;
    edges[1].style.bottom = `${innerHeight - r.bottom}px`;
    counter.hidden = !config.hud.counter;
    if (shown !== total) {
      shown = reduced.matches ? total : Math.min(total, shown + Math.max(1, Math.ceil((total - shown) * 0.15)));
      scoreEl.textContent = shown.toLocaleString();
    }
    requestAnimationFrame(sync);
  };
  sync();
}

// Apple-style progressive blur along one edge: stacked backdrop blurs, each
// stronger than the last and masked to a slightly later band, so the blur
// ramps up smoothly towards the edge with no visible line.
const BLUR_LAYERS = 6;
function progressiveBlur(side) {
  const strip = document.createElement('div');
  strip.className = `edge-blur edge-blur--${side}`;
  for (let i = 0; i < BLUR_LAYERS; i++) {
    const layer = document.createElement('div');
    const step = 100 / (BLUR_LAYERS + 1);
    const stops = [i * step, (i + 1) * step, (i + 2) * step, (i + 3) * step].map((n) => `${Math.min(100, n)}%`);
    // Doubling blur per layer, relative to the strongest at the very edge.
    layer.style.setProperty('--f', 2 ** (i - (BLUR_LAYERS - 1)));
    layer.style.setProperty(
      '--mask',
      i === BLUR_LAYERS - 1
        ? `linear-gradient(var(--dir), transparent ${stops[0]}, #000 ${stops[1]})`
        : `linear-gradient(var(--dir), transparent ${stops[0]}, #000 ${stops[1]}, #000 ${stops[2]}, transparent ${stops[3]})`,
    );
    strip.append(layer);
  }
  return strip;
}

function crosshairIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.classList.add('hud-feed__icon');
  svg.innerHTML = '<circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 0v5M8 11v5M0 8h5M11 8h5" stroke="currentColor" stroke-width="1.5"/>';
  return svg;
}
