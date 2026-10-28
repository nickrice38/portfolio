import { Pane } from 'tweakpane';
import saved from '../src/effects.config.json';
import savedPresets from '../src/effects.presets.json';
import { applyEffects } from '../src/effects/apply.js';
import { mountSpotlight } from '../src/effects/spotlight.js';
import '../src/effects/hero.css';

// Slider ranges per control. Anything not listed gets Tweakpane's default
// (checkbox for booleans, colour picker for hex strings).
const RANGES = {
  'hero.spotlightRadius': { min: 40, max: 800, step: 1 },
  'hero.spotlightSoftness': { min: 0, max: 1, step: 0.01 },
  'hero.followLag': { min: 0.01, max: 1, step: 0.01 },
};

const clone = (o) => structuredClone(o);
const config = clone(saved);
const presets = clone(savedPresets);

applyEffects(config);
mountSpotlight(document.querySelector('.hero'), config);

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
