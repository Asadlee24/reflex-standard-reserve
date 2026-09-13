# REFLEX

Independent Standard Reserve research by [Asad Lee](https://github.com/Asadlee24).

[Open the demo](https://reflex-standard-reserve.vercel.app/) · [Launch review](research/LAUNCH_REVIEW.md) · [Demo guide](research/DEMO.md)

REFLEX explores how assumed exit pressure, fees, and participant behavior interact. Dynamics runs an interactive behavioral model. SpecLab contains draft reference models, candidate properties, and authored examples for studying protocol rules.

## Evidence status

REFLEX is a research prototype. It is not an audit, a formal proof, or a verified implementation of Standard Reserve. Known differences between the model and the current design are documented in the [launch review](research/LAUNCH_REVIEW.md).

The invariant registry contains candidate properties. Selected model tests have an execution record in [validation/latest.json](validation/latest.json); this does not verify every registry candidate. The registry export does not run tests. Its results are `NOT_RUN`, run metrics are `null`, and individual properties are `UNVERIFIED`.

Trace Lab displays authored examples, not captured fuzz runs. The browser sandbox computes checks against its current simulated state; those results concern that model state only. They do not establish properties of deployed contracts.

The source matrix contains historical references and classifications that need review. A reference to a rule is not proof that the model matches it. Missing data produces an unavailable state rather than fabricated results.

## Run locally

```sh
npm test
npm run serve
```

Open `http://localhost:4173`. There are no npm dependencies required for the Node tests.

To regenerate the authored registry and examples:

```sh
node scripts/export-spec-data.mjs
```

Regeneration deliberately does not add an execution timestamp, passing count, commit identifier or run duration. Such metadata must come from an actual test execution.

For the draft Solidity model, with a compatible Foundry installation:

```sh
forge build
forge test -vvv
```

The Foundry harness defines four invariant functions and seven focused unit/fuzz tests. Node tests import `lib/spec-engine.js`, the actual browser engine. See [validation](research/VALIDATION.md) for reproducible commands and raw results. Neither suite establishes production-contract equivalence.

## Project structure

| Location | Purpose |
| --- | --- |
| `lib/model.js`, `lib/mechanism.js` | Behavioral simulation and fee model |
| `lib/spec-engine.js` | Interactive simulated state engine |
| `src/spec/` | Draft Solidity models with known design differences |
| `test/` | Draft Foundry harness |
| `tests/` | Node regression tests |
| `scripts/export-spec-data.mjs` | Authored registry and example generator |
| `generated/` | Unverified properties and illustrative traces |
| `research/`, `spec/` | Model notes, source review and candidate properties |

## Future work

The Dutch purchase semantics, terminal Charter burn, initial branch, branch cap and supply defaults are corrected. Official auction curve arithmetic, complete policy/fee integration and a verified-deployment differential adapter remain future work. This is not a Genesis mint price predictor.

The deployed demo can lag the repository while changes await merge and deployment.

MIT License. Built by Asad Lee.
