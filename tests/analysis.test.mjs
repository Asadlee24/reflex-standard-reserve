import test from 'node:test';
import assert from 'node:assert/strict';
import { compareScenarioResults, findBreakpoints, monteCarloStressTest, sensitivityAnalysis } from '../lib/analysis.js';
import { simulate } from '../lib/model.js';

test('sensitivity analysis evaluates every documented local parameter in both directions', () => {
  const analysis = sensitivityAnalysis(simulate().config);
  assert.equal(analysis.parameters.length, 6);
  assert.ok(analysis.parameters.every((parameter) => Number.isFinite(parameter.impact)));
  assert.ok(analysis.mostInfluential);
});

test('breakpoint analysis identifies the cascade threshold in a cascade path', () => {
  const result = simulate({ contagionStrength: 25, feeDeterrence: 2 });
  const analysis = findBreakpoints(result);
  assert.ok(analysis.events.some((event) => event.type === 'cascade'));
  assert.ok(analysis.peakExitRound >= 1);
});

test('seeded stress tests are exactly reproducible', () => {
  const a = monteCarloStressTest(simulate().config, { runs: 20, seed: 42 });
  const b = monteCarloStressTest(simulate().config, { runs: 20, seed: 42 });
  assert.deepEqual(a, b);
  assert.equal(a.counts.stable + a.counts.borderline + a.counts.cascade, 20);
});

test('comparison prefers the lower-regime path', () => {
  const stable = { name: 'Stable', result: simulate({ contagionStrength: 15, feeDeterrence: 10 }) };
  const cascade = { name: 'Cascade', result: simulate({ contagionStrength: 25, feeDeterrence: 2 }) };
  assert.equal(compareScenarioResults(stable, cascade).preferred, 'a');
});

