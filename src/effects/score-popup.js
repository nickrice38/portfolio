// MW2-style score pop-up above the crosshair on every shot: "+500 HEADSHOT"
// for a dead-centre shot, "+100 HIT" otherwise. Shots in quick succession
// stack into one rising total.
export function mountScorePopup(gridEl, config) {
  const el = document.createElement('div');
  el.className = 'score-popup';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="score-popup__points"></span><span class="score-popup__label"></span>';
  document.body.append(el);
  const points = el.querySelector('.score-popup__points');
  const label = el.querySelector('.score-popup__label');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let total = 0;
  let lastShot = 0;
  let anim;

  gridEl.addEventListener('shoot', ({ detail }) => {
    const s = config.score;
    if (!s.enabled) return;
    const headshot = detail.precision <= s.headshotRadius;
    const now = performance.now();
    total = s.stack && now - lastShot < s.stackWindow ? total + (headshot ? s.headshotPoints : s.hitPoints) : headshot ? s.headshotPoints : s.hitPoints;
    lastShot = now;

    const r = gridEl.getBoundingClientRect();
    el.style.left = `${r.left + r.width / 2}px`;
    el.style.top = `${r.top + r.height / 2 - s.offset}px`;
    el.dataset.font = s.font;
    points.textContent = `+${total}`;
    label.textContent = headshot ? 'Headshot' : 'Hit';
    label.hidden = !s.showLabel;

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
      { duration: s.hold / 0.56, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  });
}
