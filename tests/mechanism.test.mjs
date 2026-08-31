import test from 'node:test';
import assert from 'node:assert/strict';
import { exitPressure, resolutionFee, splitResolutionFee } from '../lib/mechanism.js';

test('exit pressure is bounded and intuitive', () => {
  assert.equal(exitPressure(0, 1), 0);
  assert.equal(exitPressure(1, 0), 1);
  assert.ok(Math.abs(exitPressure(0.1, 0.9) - 0.1) < 1e-12);
});

test('quadratic fee is bounded by floor and ceiling', () => {
  const p = { floor: 0.02, ceiling: 0.40, saturation: 0.50 };
  assert.equal(resolutionFee(0, p), 0.02);
  assert.equal(resolutionFee(1, p), 0.40);
  assert.ok(resolutionFee(0.25, p) > 0.02 && resolutionFee(0.25, p) < 0.40);
});

test('fee split reconciles exactly', () => {
  const split = splitResolutionFee(100, 0.2);
  assert.equal(split.grossFee, 20);
  assert.equal(split.burned, 10);
  assert.equal(split.redistributed, 10);
  assert.equal(split.burned + split.redistributed, split.grossFee);
});
