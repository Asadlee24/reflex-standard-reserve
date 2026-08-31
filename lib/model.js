import { clamp, exitPressure, resolutionFee, splitResolutionFee } from './mechanism.js';

export const MODEL_DEFAULTS = Object.freeze({
  initialParticipants: 1000,
  horizon: 30,
  rollingWindow: 7,
  initialShock: 0.10,
  contagionStrength: 18,
  feeDeterrence: 8,
  feeFloor: 0.02,
  feeCeiling: 0.40,
  feeSaturation: 0.50,
  baselineBias: -3.0,
  responseSharpness: 2.0,
  stableExitRate: 0.002,
  stableRounds: 5,
  cascadeCumulativeExit: 0.70,
  cascadeExitRate: 0.25,
  cascadeRounds: 3,
});

export function sigmoid(x) {
  if (x >= 0) {
    const z = Math.exp(-x);
    return 1 / (1 + z);
  }
  const z = Math.exp(x);
  return z / (1 + z);
}

/**
 * REFLEX behavioral research model.
 *
 * score = baseline + contagion * recentExitRate - feeDeterrence * currentFee
 * P(exit) = sigmoid(responseSharpness * score)
 *
 * This is intentionally minimal. It is a sensitivity model, not a psychological model.
 */
export function behavioralExitProbability({
  recentExitRate,
  currentFee,
  contagionStrength,
  feeDeterrence,
  baselineBias,
  responseSharpness,
}) {
  const score = baselineBias
    + contagionStrength * clamp(recentExitRate, 0, 1)
    - feeDeterrence * clamp(currentFee, 0, 1);

  return {
    score,
    probability: clamp(sigmoid(responseSharpness * score), 0, 1),
  };
}

export function validateConfig(input = {}) {
  const c = { ...MODEL_DEFAULTS, ...input };
  const bounded = [
    ['initialShock', 0, 1],
    ['feeFloor', 0, 1],
    ['feeCeiling', 0, 1],
    ['feeSaturation', Number.EPSILON, 1],
  ];
  for (const [key, min, max] of bounded) {
    if (!(Number.isFinite(c[key]) && c[key] >= min && c[key] <= max)) {
      throw new RangeError(`${key} must be between ${min} and ${max}.`);
    }
  }
  if (c.feeCeiling < c.feeFloor) throw new RangeError('feeCeiling must be >= feeFloor.');
  if (!(Number.isInteger(c.horizon) && c.horizon >= 2 && c.horizon <= 365)) throw new RangeError('horizon must be an integer between 2 and 365.');
  if (!(Number.isInteger(c.rollingWindow) && c.rollingWindow >= 1 && c.rollingWindow <= c.horizon)) throw new RangeError('rollingWindow must be an integer within the simulation horizon.');
  if (!(Number.isFinite(c.contagionStrength) && c.contagionStrength >= 0 && c.contagionStrength <= 50)) throw new RangeError('contagionStrength must be between 0 and 50.');
  if (!(Number.isFinite(c.feeDeterrence) && c.feeDeterrence >= 0 && c.feeDeterrence <= 50)) throw new RangeError('feeDeterrence must be between 0 and 50.');
  return c;
}

function classify(rounds, config, remainingShare) {
  const exitRates = rounds.map((r) => r.exitRate);
  const cumulativeExited = 1 - remainingShare;

  if (cumulativeExited >= config.cascadeCumulativeExit) {
    return { classification: 'cascade', reason: `Cumulative exits reached ${(cumulativeExited * 100).toFixed(1)}%.` };
  }

  for (let i = 0; i <= exitRates.length - config.cascadeRounds; i += 1) {
    const window = exitRates.slice(i, i + config.cascadeRounds);
    if (window.every((x) => x >= config.cascadeExitRate)) {
      return { classification: 'cascade', reason: `${config.cascadeRounds} consecutive rounds exceeded ${(config.cascadeExitRate * 100).toFixed(0)}% exit activity.` };
    }
  }

  if (exitRates.length >= config.stableRounds) {
    const tail = exitRates.slice(-config.stableRounds);
    if (tail.every((x) => x < config.stableExitRate)) {
      return { classification: 'stable', reason: `Exit activity stayed below ${(config.stableExitRate * 100).toFixed(2)}% for the final ${config.stableRounds} rounds.` };
    }
  }

  return { classification: 'borderline', reason: 'The path neither converged nor met the cascade rule within the selected horizon.' };
}

export function simulate(input = {}) {
  const config = validateConfig(input);
  const initialValue = 1;
  let remaining = initialValue;
  const trailing = [];
  const rounds = [];

  for (let round = 0; round < config.horizon && remaining > 1e-12; round += 1) {
    const participantsBefore = remaining;
    const withdrawalsBefore = trailing.reduce((a, b) => a + b, 0);
    const pressureBefore = exitPressure(withdrawalsBefore, remaining);
    const feeBefore = resolutionFee(pressureBefore, {
      floor: config.feeFloor,
      ceiling: config.feeCeiling,
      saturation: config.feeSaturation,
    });

    let exitRate;
    let behavioralScore = null;
    let exitProbability;

    if (round === 0) {
      exitRate = config.initialShock;
      exitProbability = config.initialShock;
    } else {
      const recentExitRate = rounds.at(-1).exitRate;
      const response = behavioralExitProbability({
        recentExitRate,
        currentFee: feeBefore,
        contagionStrength: config.contagionStrength,
        feeDeterrence: config.feeDeterrence,
        baselineBias: config.baselineBias,
        responseSharpness: config.responseSharpness,
      });
      behavioralScore = response.score;
      exitProbability = response.probability;
      exitRate = response.probability;
    }

    exitRate = clamp(exitRate, 0, 1);
    const exitedValue = Math.min(remaining, remaining * exitRate);
    remaining = Math.max(0, remaining - exitedValue);

    trailing.push(exitedValue);
    while (trailing.length > config.rollingWindow) trailing.shift();

    const trailingWithdrawals = trailing.reduce((a, b) => a + b, 0);
    const pressureAfter = exitPressure(trailingWithdrawals, remaining);
    const feeAfter = resolutionFee(pressureAfter, {
      floor: config.feeFloor,
      ceiling: config.feeCeiling,
      saturation: config.feeSaturation,
    });
    const feeSplit = splitResolutionFee(exitedValue, feeAfter);

    rounds.push({
      round,
      participantsBeforeShare: participantsBefore,
      participantsRemainingShare: remaining,
      participantsBefore: participantsBefore * config.initialParticipants,
      participantsRemaining: remaining * config.initialParticipants,
      exitedShareOfInitial: exitedValue,
      exitedParticipants: exitedValue * config.initialParticipants,
      exitRate,
      exitProbability,
      behavioralScore,
      trailingWithdrawals,
      pressureBefore,
      pressureAfter,
      feeBefore,
      feeAfter,
      grossFeeShare: feeSplit.grossFee,
      burnShare: feeSplit.burned,
      redistributionShare: feeSplit.redistributed,
      cumulativeExitedShare: 1 - remaining,
    });
  }

  const verdict = classify(rounds, config, remaining);
  const totalBurn = rounds.reduce((sum, r) => sum + r.burnShare, 0);
  const totalRedistribution = rounds.reduce((sum, r) => sum + r.redistributionShare, 0);

  return {
    config,
    rounds,
    classification: verdict.classification,
    classificationReason: verdict.reason,
    finalRemainingShare: remaining,
    cumulativeExitedShare: 1 - remaining,
    totalBurnShare: totalBurn,
    totalRedistributionShare: totalRedistribution,
  };
}
