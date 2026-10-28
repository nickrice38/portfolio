import config from './effects.config.json';
import { applyEffects } from './effects/apply.js';
import { mountInfiniteGrid } from './effects/infinite-grid.js';
import './effects/infinite-grid.css';

applyEffects(config);
mountInfiniteGrid(document.querySelector('.canvas'), config);
