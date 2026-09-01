# Research Assumptions Registry

**REFLEX Research Laboratory**  
*Curated by Asad Lee (GitHub: [@Asadlee24](https://github.com/Asadlee24))*  
*Last Updated: September 2026*

This registry isolates **REFLEX research assumptions** from **Standard Reserve protocol specifications**.

> [!IMPORTANT]
> **Separation Rule:**
> SpecLab models ONLY confirmed protocol rules (`SR-*`).
> REFLEX Dynamics introduces behavioral and parameter assumptions (`ASM-*`) to explore multi-round exit-feedback dynamics.
> No behavioral assumption is ever treated as a protocol invariant.

---

## Assumptions Ledger

| ID | Parameter / Concept | Classification | Assumed Value / Shape | Primary Source Status | Risk / Sensitivity If Wrong | Affected Modules | Resolution Condition |
|---|---|---|---|---|---|---|---|
| **`ASM-001`** | **Exit Pressure Denominator Guard** | `REFLEX ASSUMPTION` | $\epsilon = 10^{-12}$ (machine epsilon) | `REDACTED` in Whitepaper v1 | Minor numerical distortion at near-zero total pool depth | `ResolutionSpec`, `REFLEX Dynamics` | Publication of canonical contract bytecode |
| **`ASM-002`** | **Fee Floor ($F_{min}$)** | `REFLEX ASSUMPTION` | $2.0\%$ ($0.02$) | `REDACTED` (Unrevealed launch parameter) | Shifts baseline exit friction for peaceful market conditions | `ResolutionSpec`, `REFLEX Dynamics`, `INV-RESOLUTION-001` | Genesis deployment transaction verification |
| **`ASM-003`** | **Fee Ceiling ($F_{max}$)** | `REFLEX ASSUMPTION` | $40.0\%$ ($0.40$) | `REDACTED` (Unrevealed launch parameter) | Alters maximum fee deterrence during high-pressure cascades | `ResolutionSpec`, `REFLEX Dynamics`, `INV-RESOLUTION-001` | Genesis deployment transaction verification |
| **`ASM-004`** | **Fee Saturation Pressure ($S$)** | `REFLEX ASSUMPTION` | $50.0\%$ ($0.50$) | `REDACTED` (Unrevealed launch parameter) | Determines steepness of quadratic fee curve under exit stress | `ResolutionSpec`, `REFLEX Dynamics` | Deployment contract inspection |
| **`ASM-005`** | **Trailing Pressure Window ($W$)** | `SECONDARY_ONLY` | $7$ Days / 7 Epochs | Cited in Central Bank Bot methodology | Changes memory length of resolution fee response | `ResolutionSpec`, `REFLEX Dynamics` | Canonical hook contract inspection |
| **`ASM-006`** | **Participant Exit Propensity** | `REFLEX ASSUMPTION` | Logistic / Sigmoid: $P(\text{exit}) = \sigma(k \cdot \text{score})$ | `REFLEX ORIGINAL` (Not a Standard formula) | Core sensitivity model: captures behavioral exit contagion vs fee deterrence | `REFLEX Dynamics` only | Empirical participant observation post-launch |
| **`ASM-007`** | **Contagion Sensitivity ($\gamma$)** | `REFLEX ASSUMPTION` | $18.0$ (sweepable $0-50$) | `REFLEX ORIGINAL` | Determines how strongly prior round exits trigger subsequent exits | `REFLEX Dynamics` only | User scenario tuning |
| **`ASM-008`** | **Fee Deterrence Sensitivity ($\delta$)** | `REFLEX ASSUMPTION` | $8.0$ (sweepable $0-50$) | `REFLEX ORIGINAL` | Determines how effectively high resolution fees suppress exits | `REFLEX Dynamics` only | User scenario tuning |
| **`ASM-009`** | **Baseline Exit Bias ($\alpha$)** | `REFLEX ASSUMPTION` | $-3.0$ | `REFLEX ORIGINAL` | Baseline background exit rate in absence of contagion | `REFLEX Dynamics` only | User scenario tuning |
| **`ASM-010`** | **Max Branch Capacity per Charter** | `REFLEX ASSUMPTION` | $10$ Branches | `UNKNOWN` (Protocol maximum is unrevealed) | Bounds Charter footprint size in invariant tests | `BranchSpec`, `INV-BRANCH-001` | Charter contract parameter verification |
| **`ASM-011`** | **Epoch Duration** | `REFLEX ASSUMPTION` | $86,400$ seconds ($1$ Day) | `UNKNOWN` (Discretization interval) | Determines frequency of policy engine multiplier adjustments | `PolicySpec`, `INV-POLICY-002` | Canonical hook deployment |
| **`ASM-012`** | **Auction Clearing Rule** | `DERIVED` | Sealed-Bid Uniform / Vickrey Clearing | Cited in founder references (Philogy / 0xBeans) | Determines pricing curve for Expansion Licences | `AuctionSpec`, `INV-AUCTION-001` | Auction contract bytecode release |
