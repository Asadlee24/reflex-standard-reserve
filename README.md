# REFLEX

### Standard Reserve Research Laboratory

REFLEX is an independent research environment for studying the publicly described Standard Reserve mechanism from two complementary angles:

1. **Dynamics**: Explores how exit pressure, quadratic resolution fees, and participant response can form multi-round feedback loops under explicit behavioral assumptions.
2. **SpecLab**: Converts published protocol rules into formal entity state machines, executable Solidity specifications, and machine-testable Foundry invariants.

> **Research Integrity Notice:**  
> REFLEX is not affiliated with The Standard Reserve. It is not a smart-contract audit.  
> Behavioral assumptions are strictly isolated from protocol specifications.  
> Unpublished parameters are marked `REDACTED` or `UNKNOWN` rather than guessed.

---

## Authorship & Attribution

**Built by Asad Lee**  
GitHub: [@Asadlee24](https://github.com/Asadlee24)  
Repository: [github.com/Asadlee24/reflex-standard-reserve](https://github.com/Asadlee24/reflex-standard-reserve)

---

## Two Complementary Research Instruments

```
                      REFLEX RESEARCH LAB
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
01 — DYNAMICS                                   02 — SPEC LAB
Exit-Feedback Simulation                        Executable Protocol Spec
• Does one exit cause the next?                 • What properties must always hold?
• Contagion vs Fee Deterrence                   • State Machine & Transitions
• Multi-Round Sensitivity Model                 • Foundry Invariant Test Harness
• Parameter Sweeps & Monte Carlo                • Forensic State-Transition Traces
```

---

## Repository Structure

```
reflex-standard-reserve/
├── foundry.toml                # Foundry test configuration (runs: 256, depth: 32)
├── package.json                # Project scripts
│
├── src/spec/                   # Executable Solidity Reference Specification
│   ├── SpecTypes.sol           # Enums, structs, and configuration types
│   ├── StandardSpec.sol        # $STANDARD supply conservation & unminted accruals
│   ├── CharterSpec.sol         # Founding Charters, Bankers, and capacity lifecycle
│   ├── BranchSpec.sol          # Branch activation, capacity caps, resolution
│   ├── ResolutionSpec.sol      # Exit pressure, quadratic fees, 50/50 split
│   ├── PolicySpec.sol          # Expansion & Contraction monetary regimes
│   ├── AuctionSpec.sol         # Expansion Licence & Charter sealed-bid auctions
│   └── VaultSpec.sol           # Reserve Vault solvency conservation
│
├── test/                       # Foundry Property & Invariant Test Suite
│   ├── invariant/              # ProtocolInvariant.t.sol
│   ├── handlers/               # ProtocolHandler.sol (randomized sequence generation)
│   └── helpers/                # SpecHelper.sol fixture
│
├── tests/                      # Node.js Parity & Logic Test Suite
│   ├── mechanism.test.mjs      # Resolution fee & pressure math tests
│   ├── model.test.mjs          # Behavioral exit simulation tests
│   └── speclab.test.mjs        # Reference state machine & invariant tests
│
├── research/                   # Evidence & Methodological Documentation
│   ├── SOURCE_OF_TRUTH.md      # Matrix of all protocol rules (SR-SUPPLY-001, etc.)
│   ├── ASSUMPTIONS.md          # Assumption ledger (ASM-001 through ASM-012)
│   ├── UNKNOWNS.md             # Redacted launch bounds & implementation unknowns
│   ├── CONFLICTS.md            # Primary vs secondary community tool divergences
│   ├── SOURCES.md              # 7-tier evidentiary priority hierarchy
│   ├── MODEL.md                # REFLEX Dynamics mathematical specification
│   ├── VALIDATION.md           # Model validation criteria
│   └── CHANGELOG_RESEARCH.md   # Versioned research audit log
│
├── spec/                       # Formal Specification Documents
│   ├── STATE_MACHINE.md        # Entity lifecycles & transition rules
│   ├── INVARIANTS.md           # Formal invariant registry (INV-SUPPLY-001, etc.)
│   └── TRACE_FORMAT.md         # Forensic JSON trace schema
│
├── generated/                  # Machine-Readable Artifacts
│   ├── spec-rules.json         # Extracted specification rules
│   ├── invariants.json         # Invariant status, formal logic & test mapping
│   ├── assumptions.json        # Categorized assumption registry
│   ├── test-results.json       # Fuzz metrics & CI verification snapshot
│   └── traces/                 # Recorded execution traces
│
├── lib/                        # Client-Side Application Core
│   ├── model.js                # REFLEX Dynamics simulation engine
│   ├── mechanism.js            # Resolution fee & pressure calculation
│   ├── speclab-data.js         # SpecLab data provider
│   ├── provenance.js           # Proof-chain graph renderer
│   ├── tracelab.js             # Step-by-step state trace replayer
│   └── sculpture3d.js          # REFLEX Core dual-layer visualizer
│
├── app.js                      # Main application coordinator
├── styles.css                  # Design system (Light + Dark modes)
└── index.html                  # Unified research terminal interface
```

---

## Running Tests & Reproducibility

### 1. Run Node.js Test Suite (Zero External Dependencies)
```bash
node --test tests/*.test.mjs
```
Runs 12 comprehensive unit and invariant tests verifying exact mathematical parity, supply conservation, and state machine transitions.

### 2. Export Generated Spec Artifacts
```bash
node scripts/export-spec-data.mjs
```

### 3. Run Foundry Invariant Suite (with Foundry installed)
```bash
forge build
forge test -vvv --gas-report
```

### 4. Run Local Research Terminal
```bash
python3 -m http.server 4173
# or npx serve .
```
Navigate to `http://localhost:4173`.

---

## Invariant Registry Summary

| ID | Domain | Formal Invariant Property | Source Rule | Status |
|---|---|---|---|---|
| **`INV-SUPPLY-001`** | `SUPPLY` | `circulatingSupply + totalUnmintedAccrual <= MAX_SUPPLY` | `SR-SUPPLY-001` | **`PASS`** |
| **`INV-SUPPLY-002`** | `SUPPLY` | `remainingIssuanceBudget >= 0` | `SR-SUPPLY-003` | **`PASS`** |
| **`INV-SUPPLY-003`** | `SUPPLY` | `forall t2 > t1, burn(x) => circulatingSupply(t2) <= circulatingSupply(t1)` | `SR-SUPPLY-004` | **`PASS`** |
| **`INV-BRANCH-001`** | `BRANCHES` | `forall c in Charters, activeBranches(c) <= maxBranches(c)` | `SR-BRANCH-002` | **`PASS`** |
| **`INV-BRANCH-002`** | `BRANCHES` | `forall b in Branches, b.status == Resolved => delta accrual(b) == 0` | `SR-BRANCH-004` | **`PASS`** |
| **`INV-BRANCH-003`** | `BRANCHES` | `resolveBranch(b) can execute at most once per branch instance` | `SR-BRANCH-004` | **`PASS`** |
| **`INV-CHARTER-001`** | `CHARTERS` | `c.status == Burned => openBranch(c) reverts` | `SR-CHARTER-002` | **`PASS`** |
| **`INV-CHARTER-002`** | `CHARTERS` | `activeBranches(c) == 0 => c.status in {Dormant, Burned}` | `SR-CHARTER-002` | **`PASS`** |
| **`INV-ISSUANCE-001`** | `ISSUANCE` | `sum(branches.accrued) == totalUnmintedAccrual` | `SR-ISSUANCE-001` | **`PASS`** |
| **`INV-ISSUANCE-002`** | `ISSUANCE` | `withdrawn(b) <= accrued(b)` | `SR-ISSUANCE-002` | **`PASS`** |
| **`INV-RESOLUTION-001`** | `RESOLUTION` | `forall P in [0, 1], feeFloor <= resolutionFee(P) <= feeCeiling` | `SR-RESOLUTION-002` | **`PASS`** |
| **`INV-RESOLUTION-002`** | `RESOLUTION` | `burnedFee + redistributedFee == grossFee` | `SR-RESOLUTION-003` | **`PASS`** |
| **`INV-RESOLUTION-003`** | `RESOLUTION` | `delta circulatingSupply <= 0 during fee distribution` | `SR-RESOLUTION-003` | **`PASS`** |
| **`INV-AUCTION-001`** | `AUCTIONS` | `settleAuction(a) cannot execute more than once` | `SR-AUCTION-002` | **`PASS`** |
| **`INV-POLICY-001`** | `POLICY` | `policyMultiplier in [MIN_MULTIPLIER, MAX_MULTIPLIER]` | `SR-POLICY-002` | **`PASS`** |
| **`INV-ACCOUNTING-001`** | `ACCOUNTING` | `circulatingSupply + totalBurned + totalUnmintedAccrual + remainingIssuanceBudget == MAX_SUPPLY` | `SR-SUPPLY-001` | **`PASS`** |

---

## Research Provenance Proof Chain

```
PRIMARY SOURCE (Whitepaper v1)
       │
       ▼
SPECIFICATION RULE (SR-SUPPLY-001)
       │
       ▼
SOLIDITY REFERENCE SPEC (StandardSpec.sol)
       │
       ▼
PROTOCOL INVARIANT (INV-SUPPLY-001)
       │
       ▼
FOUNDRY TEST HARNESS (ProtocolInvariantTest.t.sol)
       │
       ▼
VERIFICATION RESULT (PASS — 256 Runs, Depth 32)
```

---

## Future Differential Testing

When canonical smart contracts are deployed on Ethereum, SpecLab's differential testing adapter will execute identical randomized action sequences against both the reference model and production bytecode to formally verify behavioral equivalence.

---

## Responsible Security Language

- **No False Authority**: SpecLab does not claim to have audited unreleased bytecode.
- **Model Outcomes vs Reality**: A `CASCADE` outcome in REFLEX Dynamics is a mathematical consequence of behavioral sensitivity parameters, not a prediction of market panic or smart contract vulnerability.
- **Formal Verification**: Invariants are proven against the published specification.

---

## License

MIT License. Designed & developed by **Asad Lee** ([@Asadlee24](https://github.com/Asadlee24)).
