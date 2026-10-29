// MW2-style score pop-up above the crosshair on every shot: "+500 HEADSHOT"
// for a dead-centre shot, "+100 HIT" otherwise, plus bonuses for the first
// project of the visit (FIRST BLOOD) and each project not seen before
// (NEW PROJECT). Shots in quick succession stack into one rising total.
export function mountScorePopup(gridEl, config) {
  const el = document.createElement('div');
  el.className = 'score-popup';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="score-popup__points"></span><span class="score-popup__labels"></span>';
  document.body.append(el);
  const points = el.querySelector('.score-popup__points');
  const labels = el.querySelector('.score-popup__labels');
  const seen = new Set(); // projects opened this visit
  let visitScore = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let total = 0;
  let lastShot = 0;
  let anim;

  gridEl.addEventListener('shoot', ({ detail }) => {
    const s = config.score;
    const headshot = detail.precision <= s.headshotRadius;
    // Bonuses first, so the biggest news sits at the top of the label stack.
    const awards = [];
    if (!detail.preview) {
      if (s.firstBlood && seen.size === 0) awards.push(['First blood', s.firstBloodPoints]);
      if (s.newProject && !seen.has(detail.project)) awards.push(['New project', s.newProjectPoints]);
      seen.add(detail.project);
    } else {
      if (detail.firstBlood) awards.push(['First blood', s.firstBloodPoints]);
      if (detail.newProject) awards.push(['New project', s.newProjectPoints]);
    }
    awards.push(headshot ? ['Headshot', s.headshotPoints] : ['Hit', s.hitPoints]);
    const earned = awards.reduce((sum, [, pts]) => sum + pts, 0);
    visitScore += earned;
    // Let the HUD (counter, kill feed, medals) know.
    gridEl.dispatchEvent(
      new CustomEvent('score', {
        detail: { earned, total: visitScore, awards, project: detail.project, seen: seen.size, preview: !!detail.preview },
      }),
    );
    if (!s.enabled) return;

    const now = performance.now();
    total = s.stack && now - lastShot < s.stackWindow ? total + earned : earned;
    lastShot = now;

    const r = gridEl.getBoundingClientRect();
    el.style.left = `${r.left + r.width / 2}px`;
    el.style.top = `${r.top + r.height / 2 - s.offset}px`;
    el.dataset.font = s.font;
    points.textContent = `+${total}`;
    labels.replaceChildren(...awards.map(([name]) => Object.assign(document.createElement('span'), { textContent: name })));
    labels.hidden = !s.showLabel;

    anim?.cancel();
    if (reduced.matches) {
      anim = el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: s.hold + 300 });
      return;
    }
    const base = 'translate(-50%, -50%)';
    anim = el.animate(
      [
        { opacity: 0, transform: `${base} scale(${s.popScale * 1.15})` },
        { opacity: 1, transform: `${base} scale(${s.popScale})`, offset: 0.04 },
        { opacity: 1, transform: `${base} scale(1)`, offset: 0.14 },
        { opacity: 1, transform: `${base} scale(1)`, offset: 0.7 },
        { opacity: 0, transform: `${base} translateY(${-s.rise}px) scale(0.96)` },
      ],
      { duration: (s.hold + (awards.length - 1) * 250) / 0.56, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  });

  return {
    // Forget which projects were opened, as if it's a fresh visit.
    resetVisit: () => {
      seen.clear();
      visitScore = 0;
      gridEl.dispatchEvent(new CustomEvent('score', { detail: { earned: 0, total: 0, awards: [], seen: 0, reset: true } }));
    },
  };
}
