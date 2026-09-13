# REFLEX

Independent Standard Reserve research by [Asad Lee](https://github.com/Asadlee24).

[Open the demo](https://reflex-standard-reserve.vercel.app/) · [Launch review](research/LAUNCH_REVIEW.md) · [Demo guide](research/DEMO.md)

REFLEX explores how assumed exit pressure, fees, and participant behavior interact. Dynamics runs an interactive behavioral model. SpecLab contains draft reference models, candidate properties, and authored examples for studying protocol rules.

## Evidence status

REFLEX is a research prototype. It is not an audit, a formal proof, or a verified implementation of Standard Reserve. Known differences between the model and the current design are documented in the [launch review](research/LAUNCH_REVIEW.md).

The invariant registry contains candidate properties. No Foundry execution record is attached. The registry export does not run tests. Its results are `NOT_RUN`, run metrics are `null`, and individual properties are `UNVERIFIED`.

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

These are commands to execute, not statements that execution has succeeded. The checked Foundry file defines three invariant functions. Other registry entries do not yet have implemented Foundry mappings. Node tests of the separate model in `tests/speclab.test.mjs` do not establish Solidity coverage or browser-engine parity.

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

Reconcile the reference model with current primary sources, publish reproducible execution records, establish browser/test parity, and only then build a differential adapter for the verified official deployment. That adapter is not implemented.

The deployed demo can lag the repository while changes await merge and deployment.

MIT License. Built by Asad Lee.
