# REFLEX — Assumptions

These values exist to make sensitivity analysis possible. They are **not launch parameters**.

## Exposed assumptions

| Parameter | Default | Meaning |
|---|---:|---|
| Initial shock | 10% | Fraction of remaining normalized positions forced to exit in round 1. |
| Contagion strength | 18 | Weight placed on the previous round's exit rate. |
| Fee deterrence | 8 | Weight placed on the current modeled resolution fee as an exit deterrent. |
| Fee floor | 2% | Assumed minimum resolution fee. |
| Fee ceiling | 40% | Assumed maximum resolution fee. |
| Fee saturation | 50% | Assumed exit-pressure level at which the quadratic interpolation reaches the ceiling. |
| Horizon | 30 steps | Number of modeled daily steps. |

## Fixed MVP assumptions

| Parameter | Default | Why fixed in v0.1 |
|---|---:|---|
| Baseline exit bias | -3.0 | Keeps calm-state exit propensity low. Exposing it would create a fourth behavioral slider before the core question is validated. |
| Response sharpness | 2.0 | Controls steepness of the logistic response. Fixed to avoid turning v0.1 into an unconstrained fitting surface. |
| Position size | equal | The MVP studies feedback, not whale concentration. |
| Simulation step | 1 day | Allows a literal 7-step trailing withdrawal window. |

## Known omissions

- price impact
- token price dynamics
- heterogeneous position sizes
- secondary markets
- auction behavior
- reserve-vault feedback
- issuance/policy feedback
- dormancy
- MEV
- onchain implementation details

These are deliberately excluded. REFLEX v0.1 should remain falsifiable and narrow.
