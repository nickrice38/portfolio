import { Pane } from 'tweakpane';
import saved from '../src/effects.config.json';
import savedPresets from '../src/effects.presets.json';
import { applyEffects } from '../src/effects/apply.js';
import { mountInfiniteGrid } from '../src/effects/infinite-grid.js';
import '../src/effects/infinite-grid.css';

// Slider ranges per control. Anything not listed gets Tweakpane's default
// (checkbox for booleans, colour picker for hex strings).
const RANGES = {
  'grid.cardWidth': { min: 40, max: 800, step: 1 },
  'grid.aspectRatio': { min: 0.5, max: 2.5, step: 0.001 },
  'grid.gapX': { min: 0, max: 200, step: 1 },
  'grid.gapY': { min: 0, max: 200, step: 1 },
  'grid.cornerRadius': { min: 0, max: 64, step: 1 },
  'grid.rowOffset': { min: 0, max: 1, step: 0.01 },
  'grid.zoom': { min: 0.25, max: 3, step: 0.01 },
  'motion.dragSpeed': { min: 0.25, max: 3, step: 0.05 },
  'motion.wheelSpeed': { min: 0, max: 3, step: 0.05 },
  'motion.inertia': { min: 0, max: 0.99, step: 0.01 },
  'motion.driftX': { min: -3, max: 3, step: 0.05 },
  'motion.driftY': { min: -3, max: 3, step: 0.05 },
};

const clone = (o) => structuredClone(o);
const config = clone(saved);
const presets = clone(savedPresets);

applyEffects(config);
mountInfiniteGrid(document.querySelector('.canvas'), config);

const pane = new Pane({ title: 'Effects' });

function load(values) {
  for (const group of Object.keys(config)) Object.assign(config[group], values[group]);
  pane.refresh();
  applyEffects(config);
}

const post = (path, data) =>
  fetch(path, { method: 'POST', body: JSON.stringify(data) }).then((r) => {
    if (!r.ok) throw new Error(`${path} failed: ${r.status}`);
  });

function flash(button, text) {
  const title = button.title;
  button.title = text;
  setTimeout(() => (button.title = title), 1200);
}

for (const [group, values] of Object.entries(config)) {
  const folder = pane.addFolder({ title: group });
  for (const key of Object.keys(values)) {
    folder.addBinding(values, key, { label: key, ...RANGES[`${group}.${key}`] });
  }
}
pane.on('change', () => applyEffects(config));

const actions = pane.addFolder({ title: 'config' });
const copyBtn = actions.addButton({ title: 'Copy config' });
copyBtn.on('click', async () => {
  await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  flash(copyBtn, 'Copied');
});
const saveBtn = actions.addButton({ title: 'Save to config' });
saveBtn.on('click', async () => {
  await post('/__effects/config', config);
  Object.assign(saved, clone(config));
  flash(saveBtn, 'Saved');
});
actions.addButton({ title: 'Reset to saved' }).on('click', () => load(saved));

const presetFolder = pane.addFolder({ title: 'presets' });
const presetState = { name: '', selected: '' };
presetFolder.addBinding(presetState, 'name', { label: 'new name' });
presetFolder.addButton({ title: 'Save preset' }).on('click', async () => {
  const name = presetState.name.trim();
  if (!name) return;
  presets[name] = clone(config);
  await post('/__effects/presets', presets);
  presetState.selected = name;
  renderPresetList();
});

let presetList;
function renderPresetList() {
  presetList?.dispose();
  const options = Object.fromEntries(Object.keys(presets).map((n) => [n, n]));
  if (!Object.keys(options).length) return;
  presetState.selected ||= Object.keys(options)[0];
  presetList = presetFolder.addBinding(presetState, 'selected', { label: 'load', options, index: 1 });
  presetList.on('change', ({ value }) => load(presets[value]));
}
renderPresetList();
