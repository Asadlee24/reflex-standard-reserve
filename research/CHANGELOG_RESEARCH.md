# Research Changelog & Audit Trail

**REFLEX Research Laboratory**  
*Curated by Asad Lee (GitHub: [@Asadlee24](https://github.com/Asadlee24))*

---

## [v0.2.0] — September 2026
### Added
- Integrated **SpecLab** executable reference specification and formal state machine across 8 protocol domains.
- Added **Source of Truth Matrix** (`research/SOURCE_OF_TRUTH.md`) with 24 permanent rule identifiers (`SR-SUPPLY-001` through `SR-VAULT-002`).
- Established 7-tier evidentiary priority hierarchy (`CONFIRMED`, `DERIVED`, `REDACTED`, `UNKNOWN`, `IMPLEMENTATION_DEPENDENT`, `SECONDARY_ONLY`, `CONFLICTED`).
- Added formal Invariant Registry (`spec/INVARIANTS.md`) with 16 protocol properties (`INV-SUPPLY-001` through `INV-ACCOUNTING-001`).
- Added Foundry test harness with randomized sequence handler (`test/handlers/ProtocolHandler.sol`) and reproducible fuzz traces.
- Preserved existing **REFLEX Dynamics** v0.1 model with 100% numerical parity.

## [v0.1.0] — August 2026
### Initial Release
- Initial REFLEX exit-contagion feedback model exploring trailing exit pressure, quadratic fee response, and multi-round participant sensitivity.
- Parameter sweeps across contagion and fee deterrence.
- 3D mechanism visualizer and CSV/JSON reporting.
