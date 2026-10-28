// Writes every config value onto :root as a CSS variable, e.g.
// hero.spotlightRadius -> --hero-spotlight-radius.
const UNITLESS = new Set(['hero.spotlightSoftness', 'hero.followLag']);

const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

export function applyEffects(config, root = document.documentElement) {
  for (const [group, values] of Object.entries(config)) {
    for (const [key, value] of Object.entries(values)) {
      if (typeof value === 'boolean') continue;
      const css = typeof value === 'number' && !UNITLESS.has(`${group}.${key}`) ? `${value}px` : value;
      root.style.setProperty(`--${group}-${kebab(key)}`, css);
    }
  }
}
