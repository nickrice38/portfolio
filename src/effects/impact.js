// Shot impact: a hitmarker tick (plus a ding on a headshot), a faint white
// flash on headshots, a small camera punch and a red/cyan colour split on the
// hit card. Sounds are synthesised with Web Audio, so there are no files.
export function mountImpact(gridEl, config) {
  const flash = document.createElement('div');
  flash.className = 'impact-flash';
  flash.setAttribute('aria-hidden', 'true');
  document.body.append(flash);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let audio;

  gridEl.addEventListener('shoot', ({ detail }) => {
    const fx = config.impact;
    const headshot = detail.precision <= config.score.headshotRadius;
    if (fx.sound) playHit(headshot, fx.volume);
    if (reduced.matches) return;

    if (fx.punch > 1) {
      // `add` stacks on top of the shot's recoil instead of replacing it.
      const p = headshot ? fx.punch : 1 + (fx.punch - 1) / 2;
      gridEl.animate([{ transform: 'scale(1)' }, { transform: `scale(${p})`, offset: 0.25 }, { transform: 'scale(1)' }], {
        duration: 220,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        composite: 'add',
      });
    }
    if (fx.split > 0 && detail.element) {
      const d = fx.split;
      detail.element.animate(
        [
          { boxShadow: `${-d}px 0 0 rgb(255 0 70 / 0.55), ${d}px 0 0 rgb(0 210 255 / 0.55)` },
          { boxShadow: `${-d / 3}px 0 0 rgb(255 0 70 / 0.3), ${d / 3}px 0 0 rgb(0 210 255 / 0.3)`, offset: 0.5 },
          { boxShadow: '0 0 0 transparent' },
        ],
        { duration: 200, easing: 'ease-out' },
      );
    }
    if (fx.flash && headshot) {
      const r = gridEl.getBoundingClientRect();
      Object.assign(flash.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
      flash.animate([{ opacity: fx.flashStrength }, { opacity: 0 }], { duration: 120, easing: 'ease-out' });
    }
  });

  function playHit(headshot, volume) {
    audio ??= new AudioContext();
    const now = audio.currentTime;
    const out = audio.createGain();
    out.gain.value = volume;
    out.connect(audio.destination);

    // Hitmarker: a short, bright tick.
    const tick = audio.createOscillator();
    const tickGain = audio.createGain();
    tick.type = 'square';
    tick.frequency.setValueAtTime(2400, now);
    tick.frequency.exponentialRampToValueAtTime(900, now + 0.03);
    tickGain.gain.setValueAtTime(0.25, now);
    tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    tick.connect(tickGain).connect(out);
    tick.start(now);
    tick.stop(now + 0.06);

    if (!headshot) return;
    // Headshot: a metallic ding, two detuned sines ringing out.
    for (const [freq, level] of [[1320, 0.35], [1980, 0.15]]) {
      const ding = audio.createOscillator();
      const dingGain = audio.createGain();
      ding.type = 'sine';
      ding.frequency.value = freq;
      dingGain.gain.setValueAtTime(0.0001, now + 0.02);
      dingGain.gain.exponentialRampToValueAtTime(level, now + 0.03);
      dingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      ding.connect(dingGain).connect(out);
      ding.start(now + 0.02);
      ding.stop(now + 0.5);
    }
  }
}
