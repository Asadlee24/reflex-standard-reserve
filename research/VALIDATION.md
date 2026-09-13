# Reproducible model validation

Run from the repository root with Node 24 and Foundry installed:

```sh
node scripts/verify.mjs
```

`REFLEX_FORGE` can select a local Foundry binary. The script actually executes Node tests and `forge test -vvv`, writes unmodified stdout/stderr, and records exit codes, tool versions, timestamps and SHA-256 hashes in [validation/latest.json](../validation/latest.json).

The record's base commit is contextual. The `sourceFiles` manifest identifies the exact tested working-tree bytes, including changes made before the evidence commit. Compare those hashes against the checked-out source to reproduce the same model. Execution evidence applies only to listed tests; registry export cannot turn these results into a claim that every candidate property or the official protocol is verified.

## Current coverage

- Node: 22 tests, including the actual `lib/spec-engine.js` used by the browser. Coverage includes entry, terminal retirement, capacity consumption, ten-branch limits, numeric input rejection, budget conservation and zero-flow contraction.
- Solidity: seven unit/fuzz tests covering Dutch purchase prices, earlier-receipt preservation, supply/time limits, payment failures, licence burns, Charter lifecycle and zero flow. The price monotonicity test runs 256 fuzz cases under the default configuration.
- Stateful Foundry: four invariant functions over a targeted handler. The default run executes 64 sequences at depth 32 (2,048 handler calls), checking supply, accounting, fee bounds and Charter lifecycle.

Foundry 1.8.1 reports the four invariants as one grouped test. Consequently its aggregate reports eight tests: seven unit/fuzz tests plus one invariant group. Raw logs preserve the full result without inflating the number of executed checks.

## Browser check limitation

On 13 September 2026 the local Agent Browser daemon could not bind its socket in the environment. The Cloud Browser also blocked the localhost URL (`ERR_BLOCKED_BY_CLIENT`). No successful visual/browser interaction check or production deployment verification is claimed. Node tests validate the browser engine but not rendered event bindings or layout.

## Boundaries

The auction schedule is an explicit discrete fixture. It is not the canonical exponential curve or a Genesis mint forecast. Browser/BranchSpec withdrawal fixtures omit integrated resolution fees. Policy multiplier values are illustrative. No comparison against official deployed bytecode was executed. See [launch review](LAUNCH_REVIEW.md).
