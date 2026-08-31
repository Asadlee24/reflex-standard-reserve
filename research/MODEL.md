# REFLEX — Model

## Research question

**Does an exit change the conditions in a way that makes the next exit more or less likely?**

REFLEX is a dynamical sensitivity model. It is intentionally narrower than a protocol simulator: it models only the exit-pressure → resolution-fee → next-round exit-response loop.

## Time step

The default simulation step is treated as one day so the published/derived trailing 7-day exit-pressure concept can be represented as a seven-step rolling window. This is a REFLEX modeling convention, not a claim about Standard Reserve's epoch length.

## State

At round `t`, REFLEX tracks:

- value still held (normalized to 1.0 at start)
- value exited in the last seven steps
- exit pressure
- resolution fee
- current exit rate
- cumulative exit share
- fee amount, burn share and redistribution share

For the MVP, all participants are treated as equal-sized normalized positions. This is an explicit simplification.

## Mechanism layer

### Exit pressure

The independent methodology source describes:

`P = W / max(D + W, redacted)`

REFLEX models:

`P = W / (D + W)`

with a numerical epsilon only. The redacted denominator guard is not invented.

### Resolution fee

The source describes a quadratic curve from a redacted floor to a redacted ceiling. REFLEX's interpolation is:

`q = clamp(P / saturation, 0, 1)`

`fee = floor + (ceiling - floor) * q²`

Floor, ceiling and saturation are **MODEL ASSUMPTIONS** exposed in the UI.

## Behavioral layer

REFLEX does not use personas. It uses a minimal response function:

`score(t) = baseline + contagion × exitRate(t-1) - feeDeterrence × fee(t)`

`Pr(exit at t) = logistic(responseSharpness × score(t))`

Interpretation:

- recent exits create a positive contagion force
- a more expensive exit creates a negative deterrence force
- a negative baseline prevents the model from assuming continuous mass exit in calm conditions

This is **not** a Standard Reserve formula and is not a claim about real human psychology.

## Initial condition

Round 1 is an exogenous forced exit shock. Subsequent rounds are endogenous outputs of the response model.

## Classification

MVP research classifications:

- **Stable:** exit activity remains below 0.2% for the final five rounds.
- **Cascade:** cumulative exit exceeds 70%, or three consecutive rounds each exceed 25% exit activity.
- **Borderline:** neither rule is satisfied within the horizon.

These labels describe the model path only. `CASCADE` does not mean the real protocol will fail.

## Validation result

The implemented model produces both stable and cascade regions under parameter sweeps. Example checks encoded in tests:

- contagion 15 / fee deterrence 10 → stable under defaults
- contagion 25 / fee deterrence 2 → cascade under defaults

This passes the project's minimum validation gate: the model is capable of distinct regimes rather than returning the same outcome for every setting.
