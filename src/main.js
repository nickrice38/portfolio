import config from './effects.config.json';
import { applyEffects } from './effects/apply.js';
import { mountSpotlight } from './effects/spotlight.js';
import './effects/hero.css';

applyEffects(config);
mountSpotlight(document.querySelector('.hero'), config);
