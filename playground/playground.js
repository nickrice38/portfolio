import { Pane } from 'tweakpane';
import saved from '../src/effects.config.json';
import savedPresets from '../src/effects.presets.json';
import { applyEffects } from '../src/effects/apply.js';
import { mountInfiniteGrid } from '../src/effects/infinite-grid.js';
import { mountCrosshair } from '../src/effects/crosshair.js';
import { mountShot } from '../src/effects/shot.js';
import { mountScorePopup } from '../src/effects/score-popup.js';
import { mountHud } from '../src/effects/hud.js';
import { mountImpact } from '../src/effects/impact.js';
import { mountPauseMenu } from '../src/effects/pause-menu.js';
import { MENU_ITEMS } from '../src/menu.js';
import '../src/effects/infinite-grid.css';
import '../src/effects/crosshair.css';
import '../src/effects/shot.css';
import '../src/effects/score-popup.css';
import '../src/effects/hud.css';
import '../src/effects/impact.css';
import '../src/effects/pause-menu.css';
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

// Aim assist presets. Target fill is left alone so colours stay your own.
const AIM_ASSISTS = {
  Off: { stickiness: 0, settle: 0, settleDelay: 0, liftScale: 1 },
  'Free look': { stickiness: 0.15, settle: 0, settleDelay: 0, liftScale: 1.02 },
  Gentle: { stickiness: 0.25, settle: 0.06, settleDelay: 300, liftScale: 1.03 },
  Console: { stickiness: 0.45, settle: 0.12, settleDelay: 160, liftScale: 1.04 },
  Magnetic: { stickiness: 0.65, settle: 0.22, settleDelay: 60, liftScale: 1.06 },
  'Lock-on': { stickiness: 0.85, settle: 0.4, settleDelay: 0, liftScale: 1.1 },
  'Slow drift': { stickiness: 0.3, settle: 0.03, settleDelay: 500, liftScale: 1.04 },
};

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
  'Crosshair': 'The crosshair shape: a classic cross, cross with a centre dot, just a dot, or a ring.',
  Size: 'Overall size of the crosshair, in pixels.',
  Gap: 'Empty space in the middle of the cross.',
  Thickness: 'Line weight of the crosshair.',
  Colour: 'Crosshair colour when nothing is targeted.',
  'On target': 'Crosshair and hitmarker colour when it\'s over a card.',
  Tighten: 'How much the crosshair closes in when on a card. 1 means no change, lower pulls tighter.',
  'Show name': 'Show the targeted project\'s name under the crosshair, like a nametag.',
  Assist: 'Ready-made aim assist feels, from Off to Lock-on. Pick one, then fine-tune below.',
  Sound: 'Hitmarker tick on every shot, plus a ding on headshots. Off by default so visitors aren\'t surprised.',
  Volume: 'How loud the hit sounds are.',
  'Headshot flash': 'A quick, faint white flash over the screen when you land a headshot.',
  'Flash strength': 'How bright the headshot flash gets. Keep it low; it should be felt more than seen.',
  'Camera punch': 'How much the view kicks forward on a shot. Headshots get the full amount, hits get half. 1 is off.',
  'Colour split': 'Red and cyan edges flash on the hit card, like a damage glitch, in pixels. 0 is off.',
  'Show score': 'Turn the +500 pop-up on or off.',
  Font: 'Typeface for the pop-up. Michroma is closest to the wide MW2 look.',
  'Score colour': 'Colour of the pop-up text.',
  'Text size': 'Size of the points, in pixels. The label scales with it.',
  Weight: 'How bold the points are (some fonts only come in one weight).',
  Shadow: 'Dark shadow behind the text so yellow stays readable on light cards. 0 for none.',
  Height: 'How far above the crosshair the pop-up appears, in pixels.',
  Pop: 'How big it starts before snapping to size. Higher is punchier.',
  Hold: 'How long it stays readable before floating away, in milliseconds.',
  Rise: 'How far it floats up as it fades, in pixels.',
  'Headshot pts': 'Points for a shot near the middle of a card.',
  'Hit pts': 'Points for a shot nearer the edge of a card.',
  'Headshot zone': 'How close to the middle counts as a headshot. 0.35 is the middle third or so; 1 makes every shot a headshot.',
  'New project': 'Bonus the first time each project is opened this visit.',
  'New project pts': 'Points for opening a project you haven\'t seen yet.',
  'First blood': 'Bonus for the very first project opened in a visit.',
  'First blood pts': 'Points for that first project.',
  'Show label': 'Show what you earned (HEADSHOT, NEW PROJECT…) under the points.',
  Stack: 'Quick shots in a row add up into one rising total, like a multi-kill.',
  'Stack window': 'How soon the next shot has to land to keep stacking, in milliseconds.',
  'Score counter': 'Running score and projects seen, top left.',
  'Kill feed': 'A line bottom left for every shot, like a game kill feed.',
  'Feed name': 'Your name at the start of each kill feed line.',
  'Feed lines': 'How many lines the kill feed shows at once.',
  'Feed time': 'How long each kill feed line stays before fading, in milliseconds.',
  'Streak medals': 'A banner when you\'ve seen 3, 5 and 10 different projects.',
  'Medal time': 'How long the streak banner stays on screen, in milliseconds.',
  'Moving lanes': 'Rows slide sideways on their own while you play, like a shooting gallery.',
  'Lane speed': 'How fast the lanes move, in pixels per second.',
  Pattern: 'Which way each row goes. Alternate: every row switches. In pairs: two rows each way. All one way: the whole grid flows together.',
  Variation: 'Makes some lanes a little faster than others, for a more organic feel. 0 keeps them all the same.',
  'Stop on target': 'The lane you\'re aiming at glides to a stop so you can read and shoot the card.',
  'Stop ease': 'How quickly lanes stop and start. Lower is gentler.',
  'Realign on pause': 'When you open the menu, the lanes glide back into line so the gap is clean.',
  'Edge blur': 'A soft, fading blur behind each HUD element (score, Esc hint, kill feed), like Apple\'s toolbars.',
  'Blur reach': 'How far the blur spreads past each element before it fades away, in pixels.',
  'Blur strength': 'How blurry it gets right at the edge. It fades to sharp further in.',
  'Blur tint': 'A faint wash of the background colour in the blur, to help text read. 0 for pure blur.',
  Mode: 'How you aim. Drag: click and drag the grid. Joystick: move the mouse away from the centre to steer. Mouse look: the cursor locks and the mouse turns the view, like a shooter.',
  'Dead zone': 'The calm circle in the middle. While the mouse is inside it, nothing moves.',
  'Top speed': 'How fast the grid moves with the mouse at the very edge.',
  Curve: 'How speed builds up. 1 rises evenly; higher stays slow near the dead zone, then ramps up near the edge.',
  'Show zone': 'Draws the dead zone as a dashed circle so you can see it while tuning.',
  Sensitivity: 'How far the view turns for each bit of mouse movement in Mouse look.',
  Stickiness: 'Aim assist slowdown. Movement gets this much stickier while over a card, so it\'s easier to stay on target.',
  Settle: 'When you stop moving, how strongly the nearest card is pulled under the crosshair. 0 turns it off.',
  'Settle delay': 'How long to wait after you stop before settling kicks in, in milliseconds.',
  Lift: 'How much the targeted card grows. 1 is no lift.',
  'Target fill': 'The targeted card\'s colour.',
  'ADS zoom': 'How far holding right-click or Shift zooms in on the card under the crosshair. 2 is double size.',
  'Zoom in time': 'How long the zoom takes to ease in while you hold, in milliseconds. Slower feels smoother.',
  'Zoom out time': 'How fast it snaps back when you let go, in milliseconds.',
  'Zoomed key speed': 'WASD speed while zoomed in, compared with normal. 0.5 is half speed; 1 is the same as unzoomed.',
  Recoil: 'How far the grid kicks when you shoot, in pixels. 0 for no kick.',
  'Zoom delay': 'Pause after the shot before the card zooms open, in milliseconds. Lets the hitmarker land.',
  'Zoom time': 'How long the card takes to grow into the project view, in milliseconds.',
  'Cards cleared': 'How big the gap for the menu is: the aimed card plus the rings around it. 3 × 3 removes the card and its 8 neighbours.',
  Transition: 'How long the cards take to fade out or back in, in milliseconds.',
  Stagger: 'How spread out the fade is. 0 moves all the cards together; higher ripples from the middle card outwards.',
  'Link gaps': 'When on, the horizontal and vertical gaps move together.',
  'Gap X': 'Space between cards side to side.',
  'Gap Y': 'Space between rows of cards.',
  'Row offset': 'Slides every other row sideways, like bricks in a wall. 0.5 is half a card.',
  Zoom: 'Scales the whole grid up or down, gaps and corners included.',
  'Drag speed': 'How far the grid moves when you drag. 1 follows your mouse exactly.',
  'Scroll speed': 'How fast the grid moves with a trackpad or scroll wheel.',
  'Key speed': 'How fast WASD or the arrow keys move the grid. It glides to a stop when you let go, using Inertia.',
  Inertia: 'How long the grid keeps gliding after you let go. 0 stops instantly.',
  'Drift X': 'Slow automatic movement sideways when nobody is touching it.',
  'Drift Y': 'Slow automatic movement up or down when nobody is touching it.',
  Canvas: 'The background colour behind the cards.',
  Card: 'The fill colour of every card.',
  Name: 'Type a name, then save the current settings as a preset.',
  Preset: 'Your saved presets. Pick one to switch to it, or press Load preset to re-apply the one shown.',
};

const clone = (o) => structuredClone(o);
const config = clone(saved);
const presets = clone(savedPresets);

applyEffects(config);
const canvas = document.querySelector('.canvas');
const gridApi = mountInfiniteGrid(canvas, config);
mountCrosshair(canvas, gridApi, config);
mountShot(canvas, gridApi, config);
const scorePopup = mountScorePopup(canvas, config);
mountHud(canvas, config);
mountImpact(canvas, config);
const menu = mountPauseMenu(canvas, gridApi, config, MENU_ITEMS);

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
const ui = { ratio: CUSTOM, warp: CUSTOM, aim: CUSTOM, presetName: '', preset: '' };
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
const syncAim = () => {
  const match = Object.entries(AIM_ASSISTS).find(([, a]) => Object.entries(a).every(([k, v]) => config.aim[k] === v));
  ui.aim = match ? match[0] : CUSTOM;
};
syncAim();

function load(values) {
  for (const group of Object.keys(config)) Object.assign(config[group], values[group]);
  syncRatio();
  syncWarp();
  syncAim();
  pane.refresh();
  showModeControls();
  applyEffects(config);
}

// Card
const { grid, home, warp, crosshair, aim, ads, shot, impact, score, hud, control, motion, lanes, colour } = config;
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

// Home
const homeFolder = pane.addFolder({ title: 'Menu' });
homeFolder.addBinding(home, 'size', { label: 'Cards cleared', options: { '1 × 1': 1, '3 × 3': 3, '5 × 5': 5 } });
homeFolder.addBinding(home, 'transition', { label: 'Transition', min: 200, max: 2000, step: 10 });
homeFolder.addBinding(home, 'stagger', { label: 'Stagger', min: 0, max: 2, step: 0.05 });
homeFolder.addButton({ title: 'Open menu (Esc)' }).on('click', () => menu.show());
homeFolder.addButton({ title: 'Play' }).on('click', () => menu.play());

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

// Crosshair
const crossFolder = pane.addFolder({ title: 'Crosshair' });
crossFolder.addBinding(crosshair, 'style', {
  label: 'Crosshair',
  options: { Cross: 'cross', 'Cross + dot': 'crossDot', Dot: 'dot', Ring: 'ring' },
});
crossFolder.addBinding(crosshair, 'size', { label: 'Size', min: 6, max: 80, step: 1 });
crossFolder.addBinding(crosshair, 'gap', { label: 'Gap', min: 0, max: 30, step: 1 });
crossFolder.addBinding(crosshair, 'thickness', { label: 'Thickness', min: 1, max: 6, step: 0.5 });
crossFolder.addBinding(crosshair, 'colour', { label: 'Colour' });
crossFolder.addBinding(crosshair, 'targetColour', { label: 'On target' });
crossFolder.addBinding(crosshair, 'targetTighten', { label: 'Tighten', min: 0.2, max: 1.5, step: 0.01 });
crossFolder.addBinding(crosshair, 'showLabel', { label: 'Show name' });

// Aim assist
const aimFolder = pane.addFolder({ title: 'Aim assist' });
aimFolder
  .addBinding(ui, 'aim', {
    label: 'Assist',
    options: { ...Object.fromEntries(Object.keys(AIM_ASSISTS).map((k) => [k, k])), [CUSTOM]: CUSTOM },
  })
  .on('change', ({ value }) => {
    if (value === CUSTOM) return;
    Object.assign(aim, AIM_ASSISTS[value]);
    pane.refresh();
  });
const resyncAim = () => {
  const before = ui.aim;
  syncAim();
  if (ui.aim !== before) pane.refresh();
};
aimFolder.addBinding(aim, 'stickiness', { label: 'Stickiness', min: 0, max: 0.9, step: 0.01 }).on('change', resyncAim);
aimFolder.addBinding(aim, 'settle', { label: 'Settle', min: 0, max: 0.4, step: 0.01 }).on('change', resyncAim);
aimFolder.addBinding(aim, 'settleDelay', { label: 'Settle delay', min: 0, max: 1000, step: 10 }).on('change', resyncAim);
aimFolder.addBinding(aim, 'liftScale', { label: 'Lift', min: 1, max: 1.3, step: 0.01 }).on('change', resyncAim);
aimFolder.addBinding(aim, 'targetFill', { label: 'Target fill' });

// Aim down sights
const adsFolder = pane.addFolder({ title: 'Aim down sights' });
adsFolder.addBinding(ads, 'zoom', { label: 'ADS zoom', min: 1.1, max: 4, step: 0.05 });
adsFolder.addBinding(ads, 'inTime', { label: 'Zoom in time', min: 100, max: 1500, step: 10 });
adsFolder.addBinding(ads, 'outTime', { label: 'Zoom out time', min: 50, max: 800, step: 10 });
adsFolder.addBinding(ads, 'keySpeed', { label: 'Zoomed key speed', min: 0.1, max: 1.5, step: 0.05 });

// Shot
const shotFolder = pane.addFolder({ title: 'Shot' });
shotFolder.addBinding(shot, 'recoil', { label: 'Recoil', min: 0, max: 30, step: 1 });
shotFolder.addBinding(shot, 'delay', { label: 'Zoom delay', min: 0, max: 400, step: 10 });
shotFolder.addBinding(shot, 'zoomDuration', { label: 'Zoom time', min: 100, max: 1500, step: 10 });

// Impact
const impactFolder = pane.addFolder({ title: 'Impact' });
impactFolder.addBinding(impact, 'sound', { label: 'Sound' });
impactFolder.addBinding(impact, 'volume', { label: 'Volume', min: 0, max: 1, step: 0.01 });
impactFolder.addBinding(impact, 'flash', { label: 'Headshot flash' });
impactFolder.addBinding(impact, 'flashStrength', { label: 'Flash strength', min: 0, max: 1, step: 0.01 });
impactFolder.addBinding(impact, 'punch', { label: 'Camera punch', min: 1, max: 1.15, step: 0.005 });
impactFolder.addBinding(impact, 'split', { label: 'Colour split', min: 0, max: 20, step: 0.5 });
impactFolder.addButton({ title: 'Test headshot' }).on('click', () =>
  canvas.dispatchEvent(new CustomEvent('shoot', { detail: { ...gridApi.target, precision: 0, preview: true } })),
);
impactFolder.addButton({ title: 'Test hit' }).on('click', () =>
  canvas.dispatchEvent(new CustomEvent('shoot', { detail: { ...gridApi.target, precision: 1, preview: true } })),
);

// Score
const scoreFolder = pane.addFolder({ title: 'Score pop-up' });
scoreFolder.addBinding(score, 'enabled', { label: 'Show score' });
scoreFolder.addBinding(score, 'font', { label: 'Font', options: { Michroma: 'michroma', Orbitron: 'orbitron', Inter: 'inter' } });
scoreFolder.addBinding(score, 'colour', { label: 'Score colour' });
scoreFolder.addBinding(score, 'size', { label: 'Text size', min: 20, max: 120, step: 1 });
scoreFolder.addBinding(score, 'weight', { label: 'Weight', min: 400, max: 900, step: 100 });
scoreFolder.addBinding(score, 'shadow', { label: 'Shadow', min: 0, max: 2, step: 0.05 });
scoreFolder.addBinding(score, 'offset', { label: 'Height', min: 0, max: 300, step: 1 });
scoreFolder.addBinding(score, 'popScale', { label: 'Pop', min: 1, max: 2, step: 0.01 });
scoreFolder.addBinding(score, 'hold', { label: 'Hold', min: 200, max: 2000, step: 10 });
scoreFolder.addBinding(score, 'rise', { label: 'Rise', min: 0, max: 150, step: 1 });
scoreFolder.addBinding(score, 'headshotPoints', { label: 'Headshot pts', min: 0, max: 2000, step: 50 });
scoreFolder.addBinding(score, 'hitPoints', { label: 'Hit pts', min: 0, max: 2000, step: 50 });
scoreFolder.addBinding(score, 'headshotRadius', { label: 'Headshot zone', min: 0, max: 1, step: 0.01 });
scoreFolder.addBinding(score, 'newProject', { label: 'New project' });
scoreFolder.addBinding(score, 'newProjectPoints', { label: 'New project pts', min: 0, max: 5000, step: 50 });
scoreFolder.addBinding(score, 'firstBlood', { label: 'First blood' });
scoreFolder.addBinding(score, 'firstBloodPoints', { label: 'First blood pts', min: 0, max: 5000, step: 50 });
scoreFolder.addBinding(score, 'showLabel', { label: 'Show label' });
scoreFolder.addBinding(score, 'stack', { label: 'Stack' });
scoreFolder.addBinding(score, 'stackWindow', { label: 'Stack window', min: 200, max: 5000, step: 50 });
scoreFolder.addButton({ title: 'Preview headshot' }).on('click', () =>
  canvas.dispatchEvent(new CustomEvent('shoot', { detail: { precision: 0, preview: true } })),
);
scoreFolder.addButton({ title: 'Preview hit' }).on('click', () =>
  canvas.dispatchEvent(new CustomEvent('shoot', { detail: { precision: 1, preview: true } })),
);
scoreFolder.addButton({ title: 'Preview first shot of a visit' }).on('click', () =>
  canvas.dispatchEvent(new CustomEvent('shoot', { detail: { precision: 0, preview: true, firstBlood: true, newProject: true } })),
);
scoreFolder.addButton({ title: 'Reset visit' }).on('click', () => scorePopup.resetVisit());

// HUD
const hudFolder = pane.addFolder({ title: 'HUD' });
hudFolder.addBinding(hud, 'counter', { label: 'Score counter' });
hudFolder.addBinding(hud, 'feed', { label: 'Kill feed' });
hudFolder.addBinding(hud, 'feedName', { label: 'Feed name' });
hudFolder.addBinding(hud, 'feedMax', { label: 'Feed lines', min: 1, max: 10, step: 1 });
hudFolder.addBinding(hud, 'feedHold', { label: 'Feed time', min: 1000, max: 10000, step: 100 });
hudFolder.addBinding(hud, 'medals', { label: 'Streak medals' });
hudFolder.addBinding(hud, 'medalHold', { label: 'Medal time', min: 1000, max: 6000, step: 100 });
hudFolder.addBinding(hud, 'edgeBlur', { label: 'Edge blur' });
hudFolder.addBinding(hud, 'blurReach', { label: 'Blur reach', min: 16, max: 240, step: 1 });
hudFolder.addBinding(hud, 'blurStrength', { label: 'Blur strength', min: 0, max: 64, step: 1 });
hudFolder.addBinding(hud, 'blurTint', { label: 'Blur tint', min: 0, max: 1, step: 0.01 });

// Control
const controlFolder = pane.addFolder({ title: 'Control' });
const modeBinding = controlFolder.addBinding(control, 'mode', {
  label: 'Mode',
  options: { Drag: 'drag', Joystick: 'joystick', 'Mouse look': 'look' },
});
const joystickBindings = [
  controlFolder.addBinding(control, 'deadZone', { label: 'Dead zone', min: 0, max: 0.8, step: 0.01 }),
  controlFolder.addBinding(control, 'maxSpeed', { label: 'Top speed', min: 1, max: 40, step: 0.5 }),
  controlFolder.addBinding(control, 'curve', { label: 'Curve', min: 1, max: 4, step: 0.1 }),
  controlFolder.addBinding(control, 'showDeadZone', { label: 'Show zone' }),
];
const lookBindings = [controlFolder.addBinding(control, 'lookSensitivity', { label: 'Sensitivity', min: 0.1, max: 4, step: 0.05 })];
const showModeControls = () => {
  joystickBindings.forEach((b) => (b.hidden = control.mode !== 'joystick'));
  lookBindings.forEach((b) => (b.hidden = control.mode !== 'look'));
};
modeBinding.on('change', showModeControls);
showModeControls();

// Motion
const motionFolder = pane.addFolder({ title: 'Motion' });
motionFolder.addBinding(motion, 'dragSpeed', { label: 'Drag speed', min: 0.25, max: 3, step: 0.05 });
motionFolder.addBinding(motion, 'wheelSpeed', { label: 'Scroll speed', min: 0, max: 3, step: 0.05 });
motionFolder.addBinding(motion, 'keySpeed', { label: 'Key speed', min: 1, max: 40, step: 1 });
motionFolder.addBinding(motion, 'inertia', { label: 'Inertia', min: 0, max: 0.99, step: 0.01 });
motionFolder.addBinding(motion, 'driftX', { label: 'Drift X', min: -3, max: 3, step: 0.05 });
motionFolder.addBinding(motion, 'driftY', { label: 'Drift Y', min: -3, max: 3, step: 0.05 });

// Lanes
const lanesFolder = pane.addFolder({ title: 'Lanes' });
lanesFolder.addBinding(lanes, 'enabled', { label: 'Moving lanes' });
lanesFolder.addBinding(lanes, 'speed', { label: 'Lane speed', min: 0, max: 120, step: 1 });
lanesFolder.addBinding(lanes, 'pattern', { label: 'Pattern', options: { Alternate: 'alternate', 'In pairs': 'pairs', 'All one way': 'same' } });
lanesFolder.addBinding(lanes, 'variation', { label: 'Variation', min: 0, max: 1, step: 0.01 });
lanesFolder.addBinding(lanes, 'stopOnTarget', { label: 'Stop on target' });
lanesFolder.addBinding(lanes, 'stopEase', { label: 'Stop ease', min: 0.01, max: 0.3, step: 0.01 });
lanesFolder.addBinding(lanes, 'realign', { label: 'Realign on pause' });

// Fill
const fill = pane.addFolder({ title: 'Fill' });
fill.addBinding(colour, 'background', { label: 'Canvas' });
fill.addBinding(colour, 'card', { label: 'Card' });

pane.on('change', () => applyEffects(config));

// Presets
const presetFolder = pane.addFolder({ title: 'Presets' });
let presetList;
let loadBtn;
function renderPresetList() {
  presetList?.dispose();
  loadBtn?.dispose();
  const names = Object.keys(presets);
  if (!names.length) return;
  if (!presets[ui.preset]) ui.preset = names[0];
  presetList = presetFolder.addBinding(ui, 'preset', {
    label: 'Preset',
    options: Object.fromEntries(names.map((n) => [n, n])),
    index: 0,
  });
  presetList.on('change', ({ value }) => load(presets[value]));
  // The dropdown only fires when the choice changes, so this re-applies the shown one.
  loadBtn = presetFolder.addButton({ title: 'Load preset', index: 1 });
  loadBtn.on('click', () => load(presets[ui.preset]));
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
