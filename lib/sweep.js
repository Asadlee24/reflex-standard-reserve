import { simulate } from './model.js';

export function linspace(min, max, steps) {
  if (steps <= 1) return [min];
  return Array.from({ length: steps }, (_, i) => min + (max - min) * (i / (steps - 1)));
}

/**
 * Stability map over contagion x fee-deterrence. Every cell is a full simulation.
 */
export function stabilitySweep(baseConfig, {
  xMin = 0,
  xMax = 30,
  xSteps = 25,
  yMin = 0,
  yMax = 20,
  ySteps = 19,
} = {}) {
  const xValues = linspace(xMin, xMax, xSteps);
  const yValues = linspace(yMin, yMax, ySteps);
  const cells = [];

  for (let yi = 0; yi < yValues.length; yi += 1) {
    for (let xi = 0; xi < xValues.length; xi += 1) {
      const contagionStrength = xValues[xi];
      const feeDeterrence = yValues[yi];
      const result = simulate({ ...baseConfig, contagionStrength, feeDeterrence });
      cells.push({
        xi,
        yi,
        contagionStrength,
        feeDeterrence,
        classification: result.classification,
        cumulativeExitedShare: result.cumulativeExitedShare,
      });
    }
  }

  return { xValues, yValues, cells };
}
