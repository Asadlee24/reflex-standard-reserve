# Source of Truth Matrix — The Standard Reserve

**REFLEX Research Laboratory**  
*Curated & Maintained by Asad Lee (GitHub: [@Asadlee24](https://github.com/Asadlee24))*  
*Last Comprehensive Audit: September 2026*

This matrix catalogs all known specification claims, parameters, and mechanisms of The Standard Reserve. Every modeled rule in **REFLEX SpecLab** is assigned a permanent identifier (`SR-*`) and classified according to our strict evidentiary hierarchy.

---

## Evidence Classification Hierarchy

| Classification | Meaning | Evidentiary Requirement |
|---|---|---|
| **`CONFIRMED`** | Explicit primary-source rule | Direct statement in official whitepaper, docs, or founder specification |
| **`DERIVED`** | Logical / mathematical consequence | Provably follows from confirmed rules under standard arithmetic/state invariants |
| **`REDACTED`** | Value intentionally withheld | Primary source explicitly notes the parameter or denominator is unrevealed |
| **`UNKNOWN`** | Public information unavailable | Not documented in any primary source; requires canonical contracts |
| **`IMPLEMENTATION_DEPENDENT`** | Exact mechanism depends on bytecode | Cannot be conclusively verified without deployed EVM bytecode or formal proofs |
| **`SECONDARY_ONLY`** | Third-party / community analysis | Originates from community dashboards (e.g. Central Bank Bot) without primary verification |
| **`CONFLICTED`** | Inconsistent statements | Multiple authoritative sources make contradictory claims |

---

## Specification Rules Matrix

| ID | Domain | Specification Rule Summary | Classification | Primary Source Citation | Section / Ref | Notes |
|---|---|---|---|---|---|---|
| **`SR-SUPPLY-001`** | `SUPPLY` | Hard supply cap: Total $STANDARD in existence plus unminted issuance cannot exceed the protocol hard cap. | `CONFIRMED` | Official Whitepaper v1 | §1.1 Tokenomics | Minting beyond the ceiling is strictly disallowed by protocol invariants. |
| **`SR-SUPPLY-002`** | `SUPPLY` | Genesis Issuance: A fixed initial allocation is minted at protocol genesis for initial liquidity and founding charters. | `CONFIRMED` | Official Whitepaper v1 | §1.2 Genesis Distribution | Exact genesis wallet distribution remains unrevealed until deployment. |
| **`SR-SUPPLY-003`** | `SUPPLY` | Issuance Budget: Future token creation occurs strictly through Banker accrual and policy-directed mechanisms. | `CONFIRMED` | Whitepaper / Protocol Docs | §2.3 Issuance Schedule | Unaccrued budget cannot be arbitrarily drawn down. |
| **`SR-SUPPLY-004`** | `SUPPLY` | Token Burn Permanence: Tokens burned via Resolution Fees or Expansion Licences reduce total supply permanently. | `DERIVED` | Whitepaper v1 | §4.1 Deflationary Sinks | Burn accounting must never increase total circulating or realized supply. |
| **`SR-POLICY-001`** | `POLICY` | Dual Monetary Regimes: Protocol operates in either Expansion Regime (net positive liquidity demand) or Contraction Regime. | `CONFIRMED` | Whitepaper v1 | §3.1 Monetary Policy | Determined by net ETH flow through canonical Uniswap v4 pool / hook. |
| **`SR-POLICY-002`** | `POLICY` | Policy Multiplier Bounds: Expansion rate and contraction parameters are bounded within strict mathematical envelopes. | `DERIVED` | Whitepaper v1 & Founder Notes | §3.3 Policy Engine | Prevents runaway hyper-issuance or unbounded contraction. |
| **`SR-POLICY-003`** | `POLICY` | Epoch Advancement: Monetary policy evaluations occur at discrete epoch boundaries. | `CONFIRMED` | Protocol Docs | §3.4 Epoch Timers | Epoch length (e.g. 24h vs 7d) is unrevealed until canonical deployment. |
| **`SR-POLICY-004`** | `POLICY` | Transition Smoothing: Regime changes implement hysteresis or cooldown to prevent rapid oscillation under transient volatility. | `DERIVED` | Whitepaper v1 | §3.5 Regime Hysteresis | Modeled as minimum epoch holding time before flip. |
| **`SR-CHARTER-001`** | `CHARTERS` | Founding Charters: Genesis Bankers receive Founding Charters authorizing initial Branch deployment. | `CONFIRMED` | Official Whitepaper v1 | §2.1 Charter Architecture | Non-fungible institutional authority token. |
| **`SR-CHARTER-002`** | `CHARTERS` | Charter Lifecycle: Charters transition from Active → Inactive/Dormant → Destroyed/Burned upon final Branch exit. | `DERIVED` | Whitepaper v1 | §2.4 Banker Governance | A destroyed Charter can never spawn new Branches. |
| **`SR-CHARTER-003`** | `CHARTERS` | Banker Rights: Active Charter holders are entitled to accrue protocol issuance and receive resolution fee redistributions. | `CONFIRMED` | Whitepaper v1 | §2.2 Banker Yield | Yield accrues pro-rata to active Branch capacity. |
| **`SR-BRANCH-001`** | `BRANCHES` | Branch Creation: Charters deploy Branches to manage operational capital and accrue protocol issuance. | `CONFIRMED` | Whitepaper v1 | §2.5 Branch Operations | Initial branch allotment is granted with Charter issuance. |
| **`SR-BRANCH-002`** | `BRANCHES` | Maximum Branch Limit: An active Charter cannot exceed a protocol-enforced maximum number of active Branches. | `CONFIRMED` | Whitepaper v1 | §2.6 Capacity Caps | Additional branch capacity requires Expansion Licences. |
| **`SR-BRANCH-003`** | `BRANCHES` | Branch Resolution: Bankers can voluntarily retire/resolve a Branch to realize accrued capital and exit. | `CONFIRMED` | Whitepaper v1 | §4.2 Resolution Process | Resolution triggers trailing exit pressure calculation and fees. |
| **`SR-BRANCH-004`** | `BRANCHES` | Resolution Singularity: A Branch cannot be resolved more than once (terminal state). | `DERIVED` | State Machine Logic | §4.3 State Invariants | Once `Resolved`, state is immutable. |
| **`SR-ISSUANCE-001`** | `ISSUANCE` | Accrual vs Realization: Issuance accrues internally as unminted ledger credits until explicitly realized or resolved. | `CONFIRMED` | Whitepaper v1 | §2.3 Token Distribution | Prevents inflationary front-running. |
| **`SR-ISSUANCE-002`** | `ISSUANCE` | Withdrawal Ceiling: A Banker cannot withdraw more $STANDARD than their verified accrued balance. | `DERIVED` | Accounting Invariants | §2.7 Withdrawal Controls | Conservation of internal accruals. |
| **`SR-RESOLUTION-001`** | `RESOLUTION` | Trailing Exit Pressure: Exit pressure $P$ is calculated as trailing withdrawals $W$ over total pool $(D + W)$. | `CONFIRMED` | Whitepaper v1 & CentralBankBot | §4.4 Pressure Formula | Denominator smoothing guard is redacted in public docs. |
| **`SR-RESOLUTION-002`** | `RESOLUTION` | Quadratic Resolution Fee: Exit fee scales quadratically with exit pressure between a floor ($F_{min}$) and ceiling ($F_{max}$). | `CONFIRMED` | Whitepaper v1 | §4.5 Fee Curve | $F(P) = F_{min} + (F_{max} - F_{min}) \cdot (P / S)^2$. Floor/ceiling launch values are redacted. |
| **`SR-RESOLUTION-003`** | `RESOLUTION` | Resolution Fee 50/50 Split: Exactly 50% of the gross resolution fee is burned; the remaining 50% is redistributed to non-exiting Bankers. | `CONFIRMED` | Whitepaper v1 | §4.6 Fee Routing | Conserves token accounting: $\text{Burned} + \text{Redistributed} = \text{Gross Fee}$. |
| **`SR-AUCTION-001`** | `AUCTIONS` | Expansion Licence Auctions: New Branch expansion licences are sold via competitive protocol auctions. | `CONFIRMED` | Whitepaper v1 & 0xBeans Notes | §5.1 Auction Engine | Vickrey-style / sealed-bid architecture reference (Philogy). |
| **`SR-AUCTION-002`** | `AUCTIONS` | Single Settlement: An auction instance can settle exactly once; bids cannot be refunded after settlement. | `DERIVED` | Auction State Machine | §5.3 Settlement Rules | Eliminates double-spend or duplicate licence minting. |
| **`SR-VAULT-001`** | `VAULTS` | Expansion & Contraction Vaults: Dedicated reserve vaults hold protocol-owned liquidity and hard reserves (e.g. ETH/Gold references). | `CONFIRMED` | Whitepaper v1 | §6.1 Treasury Management | Vault outflows are strictly governed by policy engine contracts. |
| **`SR-VAULT-002`** | `VAULTS` | Solvency Conservation: Vault accounting cannot create unbacked claims or negative reserve balances. | `DERIVED` | Reserve Invariants | §6.2 Solvency Rules | Invariant verified in Foundry test suite. |

---

*Note: All rules are tested in Foundry via `test/invariant/` and executable in the SpecLab interactive browser.*
