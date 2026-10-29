// Shot impact: a hitmarker "thwap" (plus a ding on a headshot), a faint white
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

  // A short buffer of white noise, made once and reused for every hit.
  let noise;
  function noiseBuffer() {
    if (noise) return noise;
    noise = audio.createBuffer(1, Math.ceil(audio.sampleRate * 0.1), audio.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return noise;
  }

  function playHit(headshot, volume) {
    audio ??= new AudioContext();
    const now = audio.currentTime;
    const out = audio.createGain();
    out.gain.value = volume;
    out.connect(audio.destination);

    // Hitmarker "thwap", OG CoD style: a burst of noise, band-passed into the
    // upper mids with a falling sweep, snapping on instantly and gone in ~60ms...
    const pitch = config.impact.hitPitch;
    const noise = audio.createBufferSource();
    noise.buffer = noiseBuffer();
    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 1.4;
    band.frequency.setValueAtTime(3200 * pitch, now);
    band.frequency.exponentialRampToValueAtTime(1100 * pitch, now + 0.05);
    const snap = audio.createGain();
    snap.gain.setValueAtTime(0.0001, now);
    snap.gain.exponentialRampToValueAtTime(0.9, now + 0.002);
    snap.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noise.connect(band).connect(snap).connect(out);
    noise.start(now);
    noise.stop(now + 0.07);

    // ...with a tiny low thump underneath for body.
    const thump = audio.createOscillator();
    const thumpGain = audio.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(220 * pitch, now);
    thump.frequency.exponentialRampToValueAtTime(90 * pitch, now + 0.04);
    thumpGain.gain.setValueAtTime(0.5, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    thump.connect(thumpGain).connect(out);
    thump.start(now);
    thump.stop(now + 0.05);

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
