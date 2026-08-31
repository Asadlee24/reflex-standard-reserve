/**
 * Public-mechanism layer used by REFLEX.
 *
 * IMPORTANT: Standard Reserve contracts are not public at the time this model
 * was authored. These functions encode the mechanism shape described by the
 * independent Central Bank Bot methodology page, which says it is derived
 * from Standard Reserve whitepaper v1. Redacted values stay configurable.
 */

export const sourceRegistry = {
  pressure: {
    status: 'third-party-derived',
    label: 'Exit pressure',
    source: 'https://centralbank.bot/methodology.html',
    note: 'Methodology describes trailing 7-day exits W and held value D with P = W / max(D + W, redacted denominator). REFLEX uses D + W plus a numerical epsilon; the redacted denominator guard is not modeled.',
  },
  resolutionFee: {
    status: 'third-party-derived',
    label: 'Resolution fee shape',
    source: 'https://centralbank.bot/methodology.html',
    note: 'Methodology describes a quadratic fee from a redacted floor to a redacted ceiling. REFLEX uses a normalized quadratic interpolation and exposes floor, ceiling and saturation as assumptions.',
  },
  feeSplit: {
    status: 'third-party-derived',
    label: 'Resolution fee split',
    source: 'https://centralbank.bot/methodology.html',
    note: 'Methodology states half of each resolution fee is burned and half is paid to bankers who stayed.',
  },
  behavior: {
    status: 'reflex-assumption',
    label: 'Behavioral response',
    source: null,
    note: 'REFLEX research assumption. It does not claim to predict real holders. Exit propensity rises with recent exits and falls as current exit cost rises.',
  },
};

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {number} trailingWithdrawals normalized value withdrawn in the rolling window
 * @param {number} heldValue normalized value still held
 */
export function exitPressure(trailingWithdrawals, heldValue) {
  const w = Math.max(0, trailingWithdrawals);
  const d = Math.max(0, heldValue);
  const denominator = Math.max(d + w, Number.EPSILON);
  return clamp(w / denominator, 0, 1);
}

/**
 * Research interpolation for a published "quadratic from floor to ceiling" shape.
 * floor, ceiling and saturation are explicitly assumptions until launch values are public.
 */
export function resolutionFee(pressure, { floor, ceiling, saturation }) {
  if (!(floor >= 0 && ceiling >= floor && ceiling <= 1)) {
    throw new RangeError('Fee bounds must satisfy 0 <= floor <= ceiling <= 1.');
  }
  if (!(saturation > 0 && saturation <= 1)) {
    throw new RangeError('Saturation must be in (0, 1].');
  }
  const normalized = clamp(pressure / saturation, 0, 1);
  return floor + (ceiling - floor) * normalized * normalized;
}

export function splitResolutionFee(withdrawnValue, feeRate) {
  const grossFee = Math.max(0, withdrawnValue) * clamp(feeRate, 0, 1);
  return {
    grossFee,
    burned: grossFee * 0.5,
    redistributed: grossFee * 0.5,
  };
}
