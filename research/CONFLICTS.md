# Source Divergences & Interpretive Conflicts

**REFLEX Research Laboratory**  
*Curated by Asad Lee (GitHub: [@Asadlee24](https://github.com/Asadlee24))*

This document tracks divergences between primary official sources (Whitepaper, Founder disclosures) and secondary/community analysis tools (e.g. Central Bank Bot, community simulators).

---

## Conflict & Divergence Ledger

### CONFLICT-01: Exit Pressure Formulation
- **Primary Source (Whitepaper v1 §4.4):** Describes trailing withdrawals relative to total held value with a redacted smoothing denominator guard.
- **Secondary Community Tool (CentralBank.bot):** Simplifies denominator as $P = W / \max(D + W, \text{redacted})$.
- **SpecLab Treatment:** We classify Central Bank Bot's formula as `SECONDARY_ONLY` and mark the smoothing denominator as an explicit assumption (`ASM-001`).

### CONFLICT-02: Charter Resolution vs Branch Resolution
- **Primary Source (Whitepaper v1 §2.4 & §4.2):** Describes Bankers operating Branches under a Charter. Charters represent the overarching institution, while Branches represent operational tranches.
- **Community Simulators:** Frequently collapse Charters and Branches into a single "Banker" entity, ignoring the multi-branch capacity lifecycle.
- **SpecLab Treatment:** SpecLab models the full multi-tier hierarchy: `CharterSpec` manages Charter instances and maximum capacity, while `BranchSpec` manages individual branch lifecycles (`Active` → `Resolving` → `Resolved`).

### CONFLICT-03: Yield Accrual Realization
- **Primary Source (Whitepaper v1 §2.3):** Notes issuance accrues to Bankers and is realized upon withdrawal or resolution.
- **Speculative Community Models:** Assume instant automated token minting directly into user wallets on every swap.
- **SpecLab Treatment:** Invariant `INV-ISSUANCE-001` enforces unminted internal accrual accounting until explicit realization, preventing artificial circulating supply inflation.
