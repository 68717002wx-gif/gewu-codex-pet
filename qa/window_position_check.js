const assert = require('assert');
const { clampWindowMove } = require('../app/window-position');

const bounds = { x: 100, y: 120, width: 320, height: 420 };
const primary = { x: 0, y: 0, width: 1440, height: 900 };
assert.deepStrictEqual(clampWindowMove(bounds, primary, 25, -30), { x: 125, y: 90 });
const firstStep = clampWindowMove(bounds, primary, 10, 5);
const secondStep = clampWindowMove({ ...bounds, ...firstStep }, primary, 15, 10);
assert.deepStrictEqual(secondStep, { x: 125, y: 135 });

const leftDisplay = { x: -1920, y: -200, width: 1920, height: 1080 };
assert.deepStrictEqual(
  clampWindowMove({ x: -1800, y: -100, width: 320, height: 420 }, leftDisplay, -500, -500),
  { x: -1912, y: -192 }
);
assert.deepStrictEqual(
  clampWindowMove({ x: -200, y: 400, width: 320, height: 420 }, leftDisplay, 500, 500),
  { x: -328, y: 452 }
);
