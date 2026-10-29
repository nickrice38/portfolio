// Bullet holes: each shot punches a jagged hole where the crosshair was on the
// card, through every copy of that project, as a "you've seen this" marker.
// The hole is cut with a CSS mask, so it's truly see-through (images on the
// cards will look shot through); a darker torn rim with cracks sits around it.
export function mountBulletHoles(gridEl, grid, config) {
  const holes = new Map(); // project -> [{ u, v, hole, rim, born }]
  let version = 0;

  gridEl.addEventListener('shoot', ({ detail }) => {
    const h = config.holes;
    if (!h.enabled || !detail.element || detail.hitU == null) return;
    const list = holes.get(detail.project) ?? [];
    const shape = jagged();
    list.push({ u: detail.hitU, v: detail.hitV, hole: svgUrl(shape.hole), rim: svgUrl(shape.rim), born: performance.now() });
    while (list.length > h.max) list.shift();
    list.key = `${detail.project}:${version + 1}`;
    holes.set(detail.project, list);
    version++;
  });

  // Mask and rim styles per project and card size, built once and shared by
  // every copy of that project.
  const styles = new Map();
  const styleFor = (list, w, h, size, rimSize) => {
    const key = `${list.key}|${list.length}|${w}|${h}|${size}|${rimSize}`;
    let st = styles.get(key);
    if (st) return st;
    const at = (hole, s) => `${hole.u * w - s / 2}px ${hole.v * h - s / 2}px`;
    const positions = ['0 0', ...list.map((hole) => at(hole, size))].join(', ');
    const sizes = ['100% 100%', ...list.map(() => `${size}px ${size}px`)].join(', ');
    // A solid layer with each hole shape excluded from it.
    const images = ['linear-gradient(#000, #000)', ...list.map((hole) => hole.hole)].join(', ');
    st = {
      maskImage: images,
      maskPosition: positions,
      maskSize: sizes,
      rim: list.map((hole) => `${hole.rim} ${at(hole, rimSize)} / ${rimSize}px ${rimSize}px no-repeat`).join(', '),
    };
    styles.set(key, st);
    return st;
  };

  // Each frame, (re)apply holes to any card whose project, size or holes changed.
  const sync = () => {
    const h = config.holes;
    if (!h.persist) {
      const now = performance.now();
      for (const [project, list] of holes) {
        const kept = list.filter((hole) => now - hole.born < h.life);
        if (kept.length !== list.length) {
          kept.key = list.key;
          kept.length ? holes.set(project, kept) : holes.delete(project);
          version++;
        }
      }
    }
    if (styles.size > 200) styles.clear();
    const size = h.size * config.grid.zoom;
    const rimSize = size * (1 + h.rim);
    for (const card of grid.cards) {
      const list = h.enabled ? holes.get(card.project) : undefined;
      const sig = list ? `${version}|${card.project}|${card.w}|${card.h}|${size}|${rimSize}` : '';
      if (card.holes === sig) continue;
      card.holes = sig;
      card.classList.toggle('has-holes', !!list);
      if (!list) {
        card.style.maskImage = card.style.webkitMaskImage = '';
        card.style.removeProperty('--holes-rim');
        continue;
      }
      const st = styleFor(list, card.w, card.h, size, rimSize);
      Object.assign(card.style, {
        maskImage: st.maskImage,
        webkitMaskImage: st.maskImage,
        maskPosition: st.maskPosition,
        webkitMaskPosition: st.maskPosition,
        maskSize: st.maskSize,
        webkitMaskSize: st.maskSize,
        maskRepeat: 'no-repeat',
        webkitMaskRepeat: 'no-repeat',
        maskComposite: 'exclude',
        webkitMaskComposite: 'xor',
      });
      card.style.setProperty('--holes-rim', st.rim);
    }
    requestAnimationFrame(sync);
  };
  sync();

  return {
    clear: () => {
      holes.clear();
      version++;
    },
  };
}

// A random jagged hole, plus a slightly bigger torn rim with a few cracks.
// Drawn in a 100x100 box centred on 50,50; the rim box is scaled up in CSS.
function jagged() {
  const spin = Math.random() * Math.PI * 2;
  const points = (count, radius, rough) =>
    Array.from({ length: count }, (_, i) => {
      const a = spin + (i / count) * Math.PI * 2;
      const r = radius * (1 - rough * Math.random());
      return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`;
    }).join(' ');
  const cracks = Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => {
    const a = Math.random() * Math.PI * 2;
    const r1 = 22;
    const r2 = 34 + Math.random() * 14;
    const bend = a + (Math.random() - 0.5) * 0.5;
    return `M${50 + Math.cos(a) * r1},${50 + Math.sin(a) * r1} L${50 + Math.cos(bend) * r2},${50 + Math.sin(bend) * r2}`;
  }).join(' ');
  return {
    hole: `<polygon points="${points(14, 48, 0.35)}" fill="#000"/>`,
    rim: `<polygon points="${points(18, 36, 0.3)}" fill="rgb(0 0 0 / 0.28)"/><path d="${cracks}" stroke="rgb(0 0 0 / 0.35)" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  };
}

function svgUrl(content) {
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${content}</svg>`)}")`;
}
