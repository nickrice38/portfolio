import config from './effects.config.json';
import { applyEffects } from './effects/apply.js';
import { mountInfiniteGrid } from './effects/infinite-grid.js';
import { mountCrosshair } from './effects/crosshair.js';
import { mountShot } from './effects/shot.js';
import './effects/infinite-grid.css';
import './effects/crosshair.css';
import './effects/shot.css';

applyEffects(config);
const canvas = document.querySelector('.canvas');
const grid = mountInfiniteGrid(canvas, config);
mountCrosshair(canvas, grid, config);
mountShot(canvas, grid, config);
