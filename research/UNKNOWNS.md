# Unknowns & Unverified Parameters

**REFLEX Research Laboratory**  
*Curated by Asad Lee (GitHub: [@Asadlee24](https://github.com/Asadlee24))*

This document catalogs every protocol parameter, formula term, or operational mechanism of The Standard Reserve that remains **unpublished, redacted, or unverified** prior to canonical contract deployment.

---

## 1. Explicitly Redacted Parameters

The primary documentation (Whitepaper v1) explicitly acknowledges the existence of these parameters but conceals their values:

| Parameter Name | Function / Context | Theoretical Purpose | Impact on SpecLab |
|---|---|---|---|
| **Fee Floor ($F_{min}$)** | `ResolutionSpec` | Minimum fee charged during zero exit pressure | Parameterized in `SpecTypes.PolicyConfig` |
| **Fee Ceiling ($F_{max}$)** | `ResolutionSpec` | Maximum fee charged during saturated exit pressure | Parameterized in `SpecTypes.PolicyConfig` |
| **Saturation Denominator ($S$)** | `ResolutionSpec` | Pressure threshold at which fee hits ceiling | Modeled as fractional threshold |
| **Denominator Smoothing Guard** | `exitPressure()` | Prevents division by zero when pool is drained | Modeled as epsilon guard $\epsilon = 10^{-12}$ |
| **Expansion Rate Multiplier Curve** | `PolicySpec` | Exact mathematical mapping from net ETH flow to token issuance | Bounded by envelope invariants in `PolicySpec` |

---

## 2. Implementation-Dependent Mechanics

These aspects cannot be verified without inspecting the audited Solidity bytecode:

1. **Uniswap v4 Hook Callbacks**: Exact hook permissions (`beforeSwap`, `afterSwap`, `beforeAddLiquidity`) and fee extraction mechanism.
2. **Banker Yield Distribution Frequency**: Continuous streaming via accumulator vs discrete epoch-based claims.
3. **Emergency Pause / Governance Controls**: Whether Charters or contracts are strictly immutable or contain multi-sig upgrade vectors.
4. **Charter Destruction Mechanics**: Whether resolving the final branch automatically burns the Charter NFT or sets it to `DORMANT`.

---

## 3. Policy on SpecLab Modeling

- **Zero Guessing**: SpecLab will NOT inject arbitrary fake constants into Solidity specification contracts.
- **Bound Parameterization**: Where parameters are required to run tests, they are passed as explicit test configurations or bounded via fuzz ranges ($F_{min} \in [0, 0.10]$, $F_{max} \in [F_{min}, 0.50]$).
- **Audit Requirement**: When contracts are deployed, differential testing will compare our reference model against canonical bytecode.
