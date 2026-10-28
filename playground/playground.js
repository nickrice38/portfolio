import { Pane } from 'tweakpane';
import saved from '../src/effects.config.json';
import savedPresets from '../src/effects.presets.json';
import { applyEffects } from '../src/effects/apply.js';
import { mountInfiniteGrid } from '../src/effects/infinite-grid.js';
import '../src/effects/infinite-grid.css';
import './panel.css';

const ASPECT_RATIOS = {
  '1:1': 1,
  '5:4': 5 / 4,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
  '16:10': 16 / 10,
  '16:9': 16 / 9,
  '21:9': 21 / 9,
  '4:5': 4 / 5,
  '3:4': 3 / 4,
  '2:3': 2 / 3,
  '9:16': 9 / 16,
};
const CUSTOM = 'Custom';

const WARPS = {
  Flat: { amount: 0, axis: 'horizontal' },
  'Subtle curve': { amount: 0.25, axis: 'horizontal' },
  'Cylinder': { amount: 0.55, axis: 'horizontal' },
  'Deep cylinder': { amount: 0.9, axis: 'horizontal' },
  'Vertical tube': { amount: 0.6, axis: 'vertical' },
  Bowl: { amount: 0.5, axis: 'both' },
  Tunnel: { amount: 0.9, axis: 'both' },
  'Subtle bulge': { amount: -0.25, axis: 'horizontal' },
  Drum: { amount: -0.6, axis: 'horizontal' },
  Globe: { amount: -0.6, axis: 'both' },
};

// Plain-language help shown when hovering a control's label, keyed by label.
const TIPS = {
  Width: 'How wide each card is, in pixels. Height follows from the ratio.',
  Ratio: 'The shape of each card. 4:3 is a classic landscape photo; 1:1 is square.',
  'Custom ratio': 'Fine-tune the shape. Higher is wider and flatter, lower is taller.',
  Radius: 'How rounded the card corners are. 0 is sharp, higher is softer.',
  Style: 'Quick starting points for the warp. Pick one, then fine-tune below.',
  Warp: 'Bends the grid. Positive curves the edges towards you, like the inside of a tube. Negative bulges it away, like a drum.',
  Axis: 'Which way it bends: side to side, top to bottom, or both at once for a bowl or globe.',
  Depth: 'How strong the 3D perspective feels. Lower is more dramatic, higher is flatter.',
  'Link gaps': 'When on, the horizontal and vertical gaps move together.',
  'Gap X': 'Space between cards side to side.',
  'Gap Y': 'Space between rows of cards.',
  'Row offset': 'Slides every other row sideways, like bricks in a wall. 0.5 is half a card.',
  Zoom: 'Scales the whole grid up or down, gaps and corners included.',
  'Drag speed': 'How far the grid moves when you drag. 1 follows your mouse exactly.',
  'Scroll speed': 'How fast the grid moves with a trackpad or scroll wheel.',
  Inertia: 'How long the grid keeps gliding after you let go. 0 stops instantly.',
  'Drift X': 'Slow automatic movement sideways when nobody is touching it.',
  'Drift Y': 'Slow automatic movement up or down when nobody is touching it.',
  Canvas: 'The background colour behind the cards.',
  Card: 'The fill colour of every card.',
  Name: 'Type a name, then save the current settings as a preset.',
  Load: 'Switch to a saved preset to compare directions.',
};

const clone = (o) => structuredClone(o);
const config = clone(saved);
const presets = clone(savedPresets);

applyEffects(config);
mountInfiniteGrid(document.querySelector('.canvas'), config);

const pane = new Pane({ container: document.querySelector('.panel') });

const post = (path, data) =>
  fetch(path, { method: 'POST', body: JSON.stringify(data) }).then((r) => {
    if (!r.ok) throw new Error(`${path} failed: ${r.status}`);
  });

function flash(button, text) {
  const title = button.title;
  button.title = text;
  setTimeout(() => (button.title = title), 1200);
}

// UI-only state that maps onto config values.
const ui = { ratio: CUSTOM, warp: CUSTOM, presetName: '', preset: '' };
const syncRatio = () => {
  const match = Object.entries(ASPECT_RATIOS).find(([, r]) => Math.abs(r - config.grid.aspectRatio) < 0.002);
  ui.ratio = match ? match[0] : CUSTOM;
};
syncRatio();
const syncWarp = () => {
  const match = Object.entries(WARPS).find(([, w]) => w.amount === config.warp.amount && w.axis === config.warp.axis);
  ui.warp = match ? match[0] : CUSTOM;
};
syncWarp();

function load(values) {
  for (const group of Object.keys(config)) Object.assign(config[group], values[group]);
  syncRatio();
  syncWarp();
  pane.refresh();
  applyEffects(config);
}

// Card
const { grid, warp, motion, colour } = config;
const card = pane.addFolder({ title: 'Card' });
card.addBinding(grid, 'cardWidth', { label: 'Width', min: 40, max: 800, step: 1 });
card
  .addBinding(ui, 'ratio', {
    label: 'Ratio',
    options: { ...Object.fromEntries(Object.keys(ASPECT_RATIOS).map((k) => [k, k])), [CUSTOM]: CUSTOM },
  })
  .on('change', ({ value }) => {
    if (value === CUSTOM) return;
    grid.aspectRatio = Math.round(ASPECT_RATIOS[value] * 1000) / 1000;
    pane.refresh();
  });
card
  .addBinding(grid, 'aspectRatio', { label: 'Custom ratio', min: 0.5, max: 2.5, step: 0.001 })
  .on('change', () => {
    const before = ui.ratio;
    syncRatio();
    if (ui.ratio !== before) pane.refresh();
  });
card.addBinding(grid, 'cornerRadius', { label: 'Radius', min: 0, max: 64, step: 1 });

// Layout
const layout = pane.addFolder({ title: 'Layout' });
layout.addBinding(grid, 'linkGaps', { label: 'Link gaps' });
const gapX = layout.addBinding(grid, 'gapX', { label: 'Gap X', min: 0, max: 200, step: 1 });
const gapY = layout.addBinding(grid, 'gapY', { label: 'Gap Y', min: 0, max: 200, step: 1 });
const linkFrom = (src, dst) => () => {
  if (grid.linkGaps && grid[dst] !== grid[src]) {
    grid[dst] = grid[src];
    pane.refresh();
  }
};
gapX.on('change', linkFrom('gapX', 'gapY'));
gapY.on('change', linkFrom('gapY', 'gapX'));
layout.addBinding(grid, 'rowOffset', { label: 'Row offset', min: 0, max: 1, step: 0.01 });
layout.addBinding(grid, 'zoom', { label: 'Zoom', min: 0.25, max: 3, step: 0.01 });

// Warp
const warpFolder = pane.addFolder({ title: 'Warp' });
warpFolder
  .addBinding(ui, 'warp', {
    label: 'Style',
    options: { ...Object.fromEntries(Object.keys(WARPS).map((k) => [k, k])), [CUSTOM]: CUSTOM },
  })
  .on('change', ({ value }) => {
    if (value === CUSTOM) return;
    Object.assign(warp, WARPS[value]);
    pane.refresh();
  });
const resyncWarp = () => {
  const before = ui.warp;
  syncWarp();
  if (ui.warp !== before) pane.refresh();
};
warpFolder.addBinding(warp, 'amount', { label: 'Warp', min: -1, max: 1, step: 0.01 }).on('change', resyncWarp);
warpFolder
  .addBinding(warp, 'axis', { label: 'Axis', options: { Horizontal: 'horizontal', Vertical: 'vertical', Both: 'both' } })
  .on('change', resyncWarp);
warpFolder.addBinding(warp, 'perspective', { label: 'Depth', min: 300, max: 3000, step: 10 });

// Motion
const motionFolder = pane.addFolder({ title: 'Motion' });
motionFolder.addBinding(motion, 'dragSpeed', { label: 'Drag speed', min: 0.25, max: 3, step: 0.05 });
motionFolder.addBinding(motion, 'wheelSpeed', { label: 'Scroll speed', min: 0, max: 3, step: 0.05 });
motionFolder.addBinding(motion, 'inertia', { label: 'Inertia', min: 0, max: 0.99, step: 0.01 });
motionFolder.addBinding(motion, 'driftX', { label: 'Drift X', min: -3, max: 3, step: 0.05 });
motionFolder.addBinding(motion, 'driftY', { label: 'Drift Y', min: -3, max: 3, step: 0.05 });

// Fill
const fill = pane.addFolder({ title: 'Fill' });
fill.addBinding(colour, 'background', { label: 'Canvas' });
fill.addBinding(colour, 'card', { label: 'Card' });

pane.on('change', () => applyEffects(config));

// Presets
const presetFolder = pane.addFolder({ title: 'Presets' });
let presetList;
function renderPresetList() {
  presetList?.dispose();
  const names = Object.keys(presets);
  if (!names.length) return;
  ui.preset ||= names[0];
  presetList = presetFolder.addBinding(ui, 'preset', {
    label: 'Load',
    options: Object.fromEntries(names.map((n) => [n, n])),
    index: 0,
  });
  presetList.on('change', ({ value }) => load(presets[value]));
}
presetFolder.addBinding(ui, 'presetName', { label: 'Name' });
presetFolder.addButton({ title: 'Save as preset' }).on('click', async () => {
  const name = ui.presetName.trim();
  if (!name) return;
  presets[name] = clone(config);
  await post('/__effects/presets', presets);
  ui.preset = name;
  ui.presetName = '';
  renderPresetList();
  pane.refresh();
});
renderPresetList();

// Config
const actions = pane.addFolder({ title: 'Config' });
const saveBtn = actions.addButton({ title: 'Save to config' });
saveBtn.element.classList.add('is-primary');
saveBtn.on('click', async () => {
  await post('/__effects/config', config);
  Object.assign(saved, clone(config));
  flash(saveBtn, 'Saved ✓');
});
const copyBtn = actions.addButton({ title: 'Copy JSON' });
copyBtn.on('click', async () => {
  await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  flash(copyBtn, 'Copied ✓');
});
actions.addButton({ title: 'Reset to saved' }).on('click', () => load(saved));

// Tooltips: one floating element, placed left of the panel beside the hovered row.
const tooltip = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'panel-tooltip' }));
document.querySelector('.panel').addEventListener('mouseover', (e) => {
  const label = e.target.closest('.tp-lblv_l');
  const text = label && TIPS[label.textContent.trim()];
  if (!text) return tooltip.classList.remove('is-visible');
  const row = label.getBoundingClientRect();
  tooltip.textContent = text;
  tooltip.style.top = `${row.top + row.height / 2}px`;
  tooltip.classList.add('is-visible');
});
document.querySelector('.panel').addEventListener('mouseleave', () => tooltip.classList.remove('is-visible'));
