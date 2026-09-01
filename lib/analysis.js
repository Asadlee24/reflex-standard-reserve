import { simulate } from './model.js';

const CLASSIFICATION_RANK = Object.freeze({ stable: 0, borderline: 1, cascade: 2 });

const SENSITIVITY_PARAMETERS = Object.freeze([
  { key: 'initialShock', label: 'Initial shock', delta: 0.02, min: 0, max: 0.5, format: 'percent' },
  { key: 'contagionStrength', label: 'Contagion', delta: 2, min: 0, max: 30, format: 'number' },
  { key: 'feeDeterrence', label: 'Fee deterrence', delta: 2, min: 0, max: 20, format: 'number' },
  { key: 'feeFloor', label: 'Fee floor', delta: 0.02, min: 0, max: 0.2, format: 'percent' },
  { key: 'feeCeiling', label: 'Fee ceiling', delta: 0.1, min: 0.1, max: 0.8, format: 'percent' },
  { key: 'feeSaturation', label: 'Fee saturation', delta: 0.1, min: 0.1, max: 1, format: 'percent' },
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function adjustedConfig(config, parameter, direction) {
  const next = {
    ...config,
    [parameter.key]: clamp(config[parameter.key] + parameter.delta * direction, parameter.min, parameter.max),
  };

  if (parameter.key === 'feeFloor') next.feeFloor = Math.min(next.feeFloor, next.feeCeiling);
  if (parameter.key === 'feeCeiling') next.feeCeiling = Math.max(next.feeCeiling, next.feeFloor);
  return next;
}

/**
 * One-at-a-time local sensitivity analysis. This measures model response around
 * the selected assumptions; it is not an empirical confidence interval.
 */
export function sensitivityAnalysis(config) {
  const base = simulate(config);
  const parameters = SENSITIVITY_PARAMETERS.map((parameter) => {
    const lowConfig = adjustedConfig(base.config, parameter, -1);
    const highConfig = adjustedConfig(base.config, parameter, 1);
    const low = simulate(lowConfig);
    const high = simulate(highConfig);
    const impact = Math.max(
      Math.abs(low.cumulativeExitedShare - base.cumulativeExitedShare),
      Math.abs(high.cumulativeExitedShare - base.cumulativeExitedShare),
    );

    return {
      ...parameter,
      baseValue: base.config[parameter.key],
      lowValue: lowConfig[parameter.key],
      highValue: highConfig[parameter.key],
      lowClassification: low.classification,
      baseClassification: base.classification,
      highClassification: high.classification,
      lowCumulativeExitedShare: low.cumulativeExitedShare,
      baseCumulativeExitedShare: base.cumulativeExitedShare,
      highCumulativeExitedShare: high.cumulativeExitedShare,
      impact,
      changesRegime: low.classification !== base.classification || high.classification !== base.classification,
    };
  }).sort((a, b) => b.impact - a.impact);

  const regimeSwitchCount = parameters.filter((parameter) => parameter.changesRegime).length;
  return {
    baseClassification: base.classification,
    baseCumulativeExitedShare: base.cumulativeExitedShare,
    parameters,
    mostInfluential: parameters[0],
    regimeSwitchCount,
    robustnessLabel: regimeSwitchCount === 0 ? 'locally robust' : regimeSwitchCount <= 2 ? 'boundary-sensitive' : 'highly sensitive',
  };
}

/** Find the first modeled moments that explain how the path changed regime. */
export function findBreakpoints(result) {
  const { rounds, config } = result;
  if (!rounds.length) return { events: [], peakExitRound: null, peakFeeRound: null };

  const events = [{
    type: 'shock',
    round: 1,
    title: 'Initial shock enters the loop',
    detail: `${(rounds[0].exitRate * 100).toFixed(1)}% exits exogenously before behavioral feedback begins.`,
  }];

  const dominanceIndex = rounds.findIndex((round, index) => {
    if (index === 0) return false;
    const previous = rounds[index - 1];
    const contagionForce = config.contagionStrength * previous.exitRate;
    const deterrenceForce = config.feeDeterrence * round.feeBefore;
    return contagionForce > deterrenceForce && round.exitRate > previous.exitRate;
  });

  if (dominanceIndex >= 0) {
    const round = rounds[dominanceIndex];
    events.push({
      type: 'dominance',
      round: round.round + 1,
      title: 'Contagion overtakes fee deterrence',
      detail: 'The modeled contagion term becomes larger than the fee-deterrence term while the exit rate is rising.',
    });
  }

  let cascadeIndex = rounds.findIndex((round) => round.cumulativeExitedShare >= config.cascadeCumulativeExit);
  if (cascadeIndex < 0) {
    for (let index = config.cascadeRounds - 1; index < rounds.length; index += 1) {
      const window = rounds.slice(index - config.cascadeRounds + 1, index + 1);
      if (window.every((round) => round.exitRate >= config.cascadeExitRate)) {
        cascadeIndex = index;
        break;
      }
    }
  }

  if (cascadeIndex >= 0) {
    events.push({
      type: 'cascade',
      round: rounds[cascadeIndex].round + 1,
      title: 'Cascade rule is first met',
      detail: `The documented model threshold is crossed with ${(rounds[cascadeIndex].cumulativeExitedShare * 100).toFixed(1)}% cumulative exits.`,
    });
  }

  let stableIndex = -1;
  for (let index = config.stableRounds - 1; index < rounds.length; index += 1) {
    const window = rounds.slice(index - config.stableRounds + 1, index + 1);
    if (window.every((round) => round.exitRate < config.stableExitRate)) {
      stableIndex = index;
      break;
    }
  }

  if (stableIndex >= 0) {
    events.push({
      type: 'stable',
      round: rounds[stableIndex].round + 1,
      title: 'Stability rule is first sustained',
      detail: `${config.stableRounds} consecutive rounds remain below ${(config.stableExitRate * 100).toFixed(2)}% exit activity.`,
    });
  }

  const peakExit = rounds.reduce((peak, round) => round.exitRate > peak.exitRate ? round : peak, rounds[0]);
  const peakFee = rounds.reduce((peak, round) => round.feeAfter > peak.feeAfter ? round : peak, rounds[0]);

  return {
    events: events.sort((a, b) => a.round - b.round),
    peakExitRound: peakExit.round + 1,
    peakExitRate: peakExit.exitRate,
    peakFeeRound: peakFee.round + 1,
    peakFeeRate: peakFee.feeAfter,
  };
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random, min, max) {
  return min + (max - min) * random();
}

/**
 * Seeded global assumption-space stress test. Percentages describe the sampled
 * model space, not probabilities of real-world outcomes.
 */
export function monteCarloStressTest(baseConfig, { runs = 100, seed = 20260831 } = {}) {
  if (!Number.isInteger(runs) || runs < 1 || runs > 5000) throw new RangeError('runs must be an integer between 1 and 5000.');
  const normalizedSeed = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : 20260831;
  const random = mulberry32(normalizedSeed);
  const samples = [];
  const counts = { stable: 0, borderline: 0, cascade: 0 };
  const histogram = Array.from({ length: 10 }, (_, index) => ({
    min: index / 10,
    max: (index + 1) / 10,
    count: 0,
  }));

  for (let index = 0; index < runs; index += 1) {
    const feeFloor = randomBetween(random, 0, 0.1);
    const config = {
      ...baseConfig,
      initialShock: randomBetween(random, 0.02, 0.3),
      contagionStrength: randomBetween(random, 0, 30),
      feeDeterrence: randomBetween(random, 0, 20),
      feeFloor,
      feeCeiling: randomBetween(random, Math.max(0.2, feeFloor), 0.8),
      feeSaturation: randomBetween(random, 0.2, 1),
    };
    const result = simulate(config);
    counts[result.classification] += 1;
    const bin = Math.min(9, Math.floor(result.cumulativeExitedShare * 10));
    histogram[bin].count += 1;
    samples.push({
      config,
      classification: result.classification,
      cumulativeExitedShare: result.cumulativeExitedShare,
    });
  }

  return { runs, seed: normalizedSeed, counts, histogram, samples };
}

export function compareScenarioResults(scenarioA, scenarioB) {
  if (!scenarioA || !scenarioB) return null;
  const rankA = CLASSIFICATION_RANK[scenarioA.result.classification];
  const rankB = CLASSIFICATION_RANK[scenarioB.result.classification];
  let preferred = 'tie';
  if (rankA < rankB) preferred = 'a';
  else if (rankB < rankA) preferred = 'b';
  else if (scenarioA.result.cumulativeExitedShare < scenarioB.result.cumulativeExitedShare - 1e-12) preferred = 'a';
  else if (scenarioB.result.cumulativeExitedShare < scenarioA.result.cumulativeExitedShare - 1e-12) preferred = 'b';

  return {
    preferred,
    cumulativeExitDifference: Math.abs(scenarioA.result.cumulativeExitedShare - scenarioB.result.cumulativeExitedShare),
    sameRegime: scenarioA.result.classification === scenarioB.result.classification,
  };
}

