# Candidate model properties

The registry contains unverified properties of the draft REFLEX model. Source mappings need review. See [Launch review](../research/LAUNCH_REVIEW.md).

No execution record is attached. Three entries map to functions present in `test/invariant/ProtocolInvariant.t.sol`; the other Foundry mappings remain unimplemented.

| ID | Domain | Candidate property | Implemented Foundry mapping | Evidence |
| --- | --- | --- | --- | --- |
| `INV-SUPPLY-001` | SUPPLY | `circulatingSupply + totalUnmintedAccrual <= MAX_SUPPLY` | `test/invariant/ProtocolInvariant.t.sol::invariant_SupplyHardCap` | UNVERIFIED |
| `INV-SUPPLY-002` | SUPPLY | `remainingIssuanceBudget >= 0` | None | UNVERIFIED |
| `INV-SUPPLY-003` | SUPPLY | `forall t2 > t1, burn(x) => circulatingSupply(t2) <= circulatingSupply(t1)` | None | UNVERIFIED |
| `INV-BRANCH-001` | BRANCHES | `forall c in Charters, activeBranches(c) <= maxBranches(c)` | None | UNVERIFIED |
| `INV-BRANCH-002` | BRANCHES | `forall b in Branches, b.status == Resolved => delta accrual(b) == 0` | None | UNVERIFIED |
| `INV-BRANCH-003` | BRANCHES | `resolveBranch(b) can execute at most once per branch instance` | None | UNVERIFIED |
| `INV-CHARTER-001` | CHARTERS | `c.status == Burned => openBranch(c) reverts` | None | UNVERIFIED |
| `INV-CHARTER-002` | CHARTERS | `activeBranches(c) == 0 => c.status in {Dormant, Burned}` | None | UNVERIFIED |
| `INV-ISSUANCE-001` | ISSUANCE | `sum(branches.accrued) == totalUnmintedAccrual` | None | UNVERIFIED |
| `INV-ISSUANCE-002` | ISSUANCE | `withdrawn(b) <= accrued(b)` | None | UNVERIFIED |
| `INV-RESOLUTION-001` | RESOLUTION | `forall P in [0, 1], feeFloor <= resolutionFee(P) <= feeCeiling` | `test/invariant/ProtocolInvariant.t.sol::invariant_FeeBounds` | UNVERIFIED |
| `INV-RESOLUTION-002` | RESOLUTION | `burnedFee + redistributedFee == grossFee` | None | UNVERIFIED |
| `INV-RESOLUTION-003` | RESOLUTION | `delta circulatingSupply <= 0 during fee distribution` | None | UNVERIFIED |
| `INV-AUCTION-001` | AUCTIONS | `settleAuction(a) cannot execute more than once` | None | UNVERIFIED |
| `INV-POLICY-001` | POLICY | `policyMultiplier in [MIN_MULTIPLIER, MAX_MULTIPLIER]` | None | UNVERIFIED |
| `INV-ACCOUNTING-001` | ACCOUNTING | `circulatingSupply + totalBurned + totalUnmintedAccrual + remainingIssuanceBudget == MAX_SUPPLY` | `test/invariant/ProtocolInvariant.t.sol::invariant_AccountingConservation` | UNVERIFIED |

A test function existing is not proof that it ran or passed. Local sandbox PASS/FAIL checks evaluate only the current simulated state. A future execution record must identify its command, implementation, source commit and actual output.
