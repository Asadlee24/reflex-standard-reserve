# Protocol Invariant Registry

**REFLEX SpecLab — The Standard Reserve**  
*Curated by Asad Lee (GitHub: [@Asadlee24](https://github.com/Asadlee24))*

This registry details the formal protocol invariants derived from confirmed primary sources and mathematical state conservation laws.

---

## Invariant Ledger

| ID | Domain | Formal Invariant Property | Source Rule | Classification | Foundry Test | Status |
|---|---|---|---|---|---|---|
| **`INV-SUPPLY-001`** | `SUPPLY` | $\text{circulatingSupply} + \text{unmintedAccruals} \le \text{MAX\_SUPPLY}$ | `SR-SUPPLY-001` | `CONFIRMED` | `SupplyInvariant.t.sol` | **`PASS`** |
| **`INV-SUPPLY-002`** | `SUPPLY` | $\text{remainingIssuanceBudget} \ge 0$ | `SR-SUPPLY-003` | `DERIVED` | `SupplyInvariant.t.sol` | **`PASS`** |
| **`INV-SUPPLY-003`** | `SUPPLY` | $\forall t_2 > t_1, \text{burn}(x) \implies \text{circulatingSupply}(t_2) \le \text{circulatingSupply}(t_1)$ | `SR-SUPPLY-004` | `DERIVED` | `SupplyInvariant.t.sol` | **`PASS`** |
| **`INV-BRANCH-001`** | `BRANCHES` | $\forall c \in \text{Charters}, \text{activeBranches}(c) \le \text{maxBranches}(c)$ | `SR-BRANCH-002` | `CONFIRMED` | `BranchInvariant.t.sol` | **`PASS`** |
| **`INV-BRANCH-002`** | `BRANCHES` | $\forall b \in \text{Branches}, b.\text{status} == \text{Resolved} \implies \Delta \text{accrual}(b) == 0$ | `SR-BRANCH-004` | `DERIVED` | `BranchInvariant.t.sol` | **`PASS`** |
| **`INV-BRANCH-003`** | `BRANCHES` | $\text{resolveBranch}(b)$ can execute at most once per branch instance. | `SR-BRANCH-004` | `DERIVED` | `BranchInvariant.t.sol` | **`PASS`** |
| **`INV-CHARTER-001`** | `CHARTERS` | $c.\text{status} == \text{Burned} \implies \text{openBranch}(c) \text{ reverts}$ | `SR-CHARTER-002` | `DERIVED` | `CharterInvariant.t.sol` | **`PASS`** |
| **`INV-CHARTER-002`** | `CHARTERS` | $\text{activeBranches}(c) == 0 \implies c.\text{status} \in \{\text{Dormant}, \text{Burned}\}$ | `SR-CHARTER-002` | `DERIVED` | `CharterInvariant.t.sol` | **`PASS`** |
| **`INV-ISSUANCE-001`** | `ISSUANCE` | $\sum_{b \in \text{Branches}} b.\text{accrued} == \text{totalUnmintedAccrual}$ | `SR-ISSUANCE-001` | `CONFIRMED` | `IssuanceInvariant.t.sol` | **`PASS`** |
| **`INV-ISSUANCE-002`** | `ISSUANCE` | $\forall b, \text{withdrawn}(b) \le \text{accrued}(b)$ | `SR-ISSUANCE-002` | `DERIVED` | `IssuanceInvariant.t.sol` | **`PASS`** |
| **`INV-RESOLUTION-001`** | `RESOLUTION` | $\forall P \in [0, 1], F_{min} \le \text{resolutionFee}(P) \le F_{max}$ | `SR-RESOLUTION-002` | `CONFIRMED` | `ResolutionInvariant.t.sol` | **`PASS`** |
| **`INV-RESOLUTION-002`** | `RESOLUTION` | $\text{burnedFee} + \text{redistributedFee} == \text{grossFee}$ | `SR-RESOLUTION-003` | `CONFIRMED` | `ResolutionInvariant.t.sol` | **`PASS`** |
| **`INV-RESOLUTION-003`** | `RESOLUTION` | Fee distribution does not inflate total token supply ($\Delta \text{supply} \le 0$). | `SR-RESOLUTION-003` | `DERIVED` | `ResolutionInvariant.t.sol` | **`PASS`** |
| **`INV-AUCTION-001`** | `AUCTIONS` | $\text{settleAuction}(a)$ cannot execute more than once. | `SR-AUCTION-002` | `DERIVED` | `AuctionInvariant.t.sol` | **`PASS`** |
| **`INV-POLICY-001`** | `POLICY` | $\text{policyMultiplier} \in [\text{MIN\_MULTIPLIER}, \text{MAX\_MULTIPLIER}]$ | `SR-POLICY-002` | `DERIVED` | `PolicyInvariant.t.sol` | **`PASS`** |
| **`INV-ACCOUNTING-001`** | `ACCOUNTING` | $\text{Genesis} + \text{TotalMinted} - \text{TotalBurned} + \text{UnmintedAccruals} + \text{RemainingBudget} == \text{MAX\_SUPPLY}$ | `SR-SUPPLY-001` | `DERIVED` | `AccountingInvariant.t.sol` | **`PASS`** |

---

## Invariant Classification Definitions

- **`PASS`**: Verified across multi-step randomized action sequences in Foundry fuzz/invariant test harness.
- **`CANDIDATE`**: Hypothesized property requiring canonical deployment bytecode confirmation.
- **`BLOCKED`**: Depends on currently redacted protocol formulas.
- **`UNKNOWN`**: Specification is ambiguous or unreleased.
