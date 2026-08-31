import test from 'node:test';
import assert from 'node:assert/strict';
import { behavioralExitProbability, simulate } from '../lib/model.js';

test('higher exit cost cannot increase exit probability when other terms are fixed', () => {
  const base = {
    recentExitRate: 0.1,
    contagionStrength: 10,
    feeDeterrence: 8,
    baselineBias: -3,
    responseSharpness: 2,
  };
  const low = behavioralExitProbability({ ...base, currentFee: 0.02 }).probability;
  const high = behavioralExitProbability({ ...base, currentFee: 0.40 }).probability;
  assert.ok(high < low);
});

test('if fee deterrence is zero, changing fee does not change behavior', () => {
  const base = {
    recentExitRate: 0.1,
    contagionStrength: 10,
    feeDeterrence: 0,
    baselineBias: -3,
    responseSharpness: 2,
  };
  const a = behavioralExitProbability({ ...base, currentFee: 0.02 }).probability;
  const b = behavioralExitProbability({ ...base, currentFee: 0.80 }).probability;
  assert.equal(a, b);
});

test('simulation preserves accounting bounds', () => {
  const result = simulate();
  for (const r of result.rounds) {
    assert.ok(r.participantsRemaining >= -1e-9);
    assert.ok(r.exitRate >= 0 && r.exitRate <= 1);
    assert.ok(r.pressureAfter >= 0 && r.pressureAfter <= 1);
    assert.ok(r.feeAfter >= result.config.feeFloor - 1e-12);
    assert.ok(r.feeAfter <= result.config.feeCeiling + 1e-12);
    assert.ok(Math.abs((r.burnShare + r.redistributionShare) - r.grossFeeShare) < 1e-12);
  }
  assert.ok(result.cumulativeExitedShare <= 1 + 1e-12);
});

test('same configuration is deterministic', () => {
  assert.deepEqual(simulate({ contagionStrength: 17.5 }), simulate({ contagionStrength: 17.5 }));
});

test('model exhibits distinct stable and cascade regimes', () => {
  const stable = simulate({ contagionStrength: 15, feeDeterrence: 10 });
  const cascade = simulate({ contagionStrength: 25, feeDeterrence: 2 });
  assert.equal(stable.classification, 'stable');
  assert.equal(cascade.classification, 'cascade');
});
