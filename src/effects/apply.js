// Writes every config value onto :root as a CSS variable, e.g.
// grid.cornerRadius -> --grid-corner-radius. Numbers stay unitless;
// CSS adds units with calc(var(--x) * 1px).
const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

export function applyEffects(config, root = document.documentElement) {
  for (const [group, values] of Object.entries(config)) {
    for (const [key, value] of Object.entries(values)) {
      if (typeof value === 'boolean') continue;
      root.style.setProperty(`--${group}-${kebab(key)}`, value);
    }
  }
}
