# REFLEX

### Does one exit cause the next?

REFLEX is an independent, reproducible exit-dynamics research model for the publicly described Standard Reserve resolution mechanism.

It starts where a single-shot resolution-fee calculator stops: after an exit changes pressure and the fee, **what happens next if participants respond to the new state?**

## What REFLEX is

- a narrow dynamical-system experiment
- a multi-round feedback model
- a parameter-sensitivity tool
- fully client-side and reproducible
- explicit about what is sourced vs assumed

## What it is not

- not affiliated with The Standard Reserve
- not a price model
- not financial advice
- not a smart-contract audit
- not a vulnerability finding
- not a prediction of real holder behavior

## Run locally

No dependencies are required.

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Tests

Requires Node 20+.

```bash
npm test
```

## Core model

The behavioral layer is intentionally minimal:

```text
score = baseline + contagion × priorExitRate - feeDeterrence × currentFee
P(exit) = logistic(responseSharpness × score)
```

This is a REFLEX research assumption, **not** a Standard Reserve formula.

See:

- `research/SOURCES.md`
- `research/MODEL.md`
- `research/ASSUMPTIONS.md`

## Why no React / wallet / RPC in v0.1?

The research question does not need them. v0.1 is intentionally zero-dependency so the simulation can be reviewed, reproduced and deployed as a static site without hiding the model behind application plumbing.

If the model remains useful after contracts and final launch parameters are public, the interface can be migrated to Next.js and the mechanism layer can be replaced with exact contract-derived parameters.

## Sources

- https://standardreserve.xyz/
- https://centralbank.bot/
- https://centralbank.bot/methodology.html
- https://centralbank.bot/simulator.html

## Responsible framing

A result labeled `CASCADE` means only that **this model, under these assumptions**, crossed its documented cascade classification rule. It does not mean the real protocol will collapse or that any deployed code is vulnerable.
