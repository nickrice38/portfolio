// Named combinations shared by the dev playground and the visitor Settings menu.

// Aim assist presets. Target fill is left alone so colours stay your own.
export const AIM_ASSISTS = {
  Off: { stickiness: 0, settle: 0, settleDelay: 0, liftScale: 1 },
  'Free look': { stickiness: 0.15, settle: 0, settleDelay: 0, liftScale: 1.02 },
  Gentle: { stickiness: 0.25, settle: 0.06, settleDelay: 300, liftScale: 1.03 },
  Console: { stickiness: 0.45, settle: 0.12, settleDelay: 160, liftScale: 1.04 },
  Magnetic: { stickiness: 0.65, settle: 0.22, settleDelay: 60, liftScale: 1.06 },
  'Lock-on': { stickiness: 0.85, settle: 0.4, settleDelay: 0, liftScale: 1.1 },
  'Slow drift': { stickiness: 0.3, settle: 0.03, settleDelay: 500, liftScale: 1.04 },
};

export const WARPS = {
  Flat: { amount: 0, axis: 'horizontal' },
  'Subtle curve': { amount: 0.25, axis: 'horizontal' },
  Cylinder: { amount: 0.55, axis: 'horizontal' },
  'Deep cylinder': { amount: 0.9, axis: 'horizontal' },
  'Vertical tube': { amount: 0.6, axis: 'vertical' },
  Bowl: { amount: 0.5, axis: 'both' },
  Tunnel: { amount: 0.9, axis: 'both' },
  'Subtle bulge': { amount: -0.25, axis: 'horizontal' },
  Drum: { amount: -0.6, axis: 'horizontal' },
  Globe: { amount: -0.6, axis: 'both' },
};
