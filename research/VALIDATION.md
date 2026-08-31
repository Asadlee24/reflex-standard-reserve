# REFLEX — Validation gate

REFLEX was not allowed to proceed to a polished interface until the core loop demonstrated more than one meaningful regime.

## Test status

`npm test` currently runs 8 deterministic tests covering:

- exit-pressure bounds
- quadratic fee bounds
- 50/50 modeled fee accounting
- monotonic fee deterrence sanity check
- zero-deterrence invariance
- simulation accounting bounds
- deterministic replay
- presence of both stable and cascade regimes

All 8 tests pass.

## Parameter sweep

The UI's default stability map runs 651 complete simulations:

- contagion strength: 0 → 30 (31 steps)
- fee deterrence: 0 → 20 (21 steps)
- all other parameters: current baseline defaults

Current result distribution:

- **374 stable**
- **146 borderline**
- **131 cascade**

This satisfies the MVP validation gate: the model does not mechanically return one result across assumption space.

## What this does *not* prove

It does not validate the real Standard Reserve protocol. The split exists because of the REFLEX behavioral model and the selected assumption ranges. The stability map is useful only as a sensitivity surface: a reader should be able to disagree with an assumption, change it, and reproduce the resulting path.
