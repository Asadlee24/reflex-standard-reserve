# REFLEX — Source ledger

Last checked: 31 August 2026.

REFLEX deliberately distinguishes protocol claims from third-party interpretation and its own research assumptions. The Standard Reserve production contracts were not public in the sources checked for this MVP, so this is **not** a contract model.

| Item | Status used in REFLEX | Source | What the source supports | What REFLEX does not claim |
|---|---|---|---|---|
| Protocol is pre-Genesis / feeds not live | Third-party current-state description | https://centralbank.bot/ | Central Bank Bot states it is community-built and that feeds go live when contracts do. | That Central Bank Bot is official. |
| Exit pressure | Third-party derivation from whitepaper v1 | https://centralbank.bot/methodology.html | Trailing 7-day withdrawals W, still-held D, pressure `P = W / max(D + W, redacted)`. | The redacted denominator guard. |
| Resolution fee | Third-party derivation from whitepaper v1 | https://centralbank.bot/methodology.html | Fee is quadratic in pressure from a redacted floor to redacted ceiling. | Exact launch floor, ceiling or saturation. |
| Fee split | Third-party derivation from whitepaper v1 | https://centralbank.bot/methodology.html | Half of each resolution fee is described as burned, half paid to bankers who stayed. | Exact implementation details. |
| Existing static simulation | Direct observation | https://centralbank.bot/simulator.html | Simulation 02 takes a weekly exit-share input and computes a single fee/burn/redistribution result. | Any claim that Central Bank Bot endorses REFLEX. |
| 15 contracts / audits | Official-account statement mirrored publicly | https://x.noodl3.net/febrinoabstract | Mirror shows @standard_rsv stating first audit round began and 15 contracts work in sync. | Auditor identity or audit result. |
| No token/NFT live; no surprise launch | Official-account statement mirrored publicly | https://x.noodl3.net/febrinoabstract/with_replies | Mirror reproduces @standard_rsv's Aug 23 statement. | Current deployment status beyond the checked date. |

## Primary-source limitation

The official Standard Reserve website is a client-rendered application and was not reliably retrievable by the research environment used to generate this MVP. REFLEX therefore does **not** label Central Bank Bot's methodology as an official Standard Reserve source. Its formula layer is marked `third-party-derived` in the interface and code.

Before any public launch of REFLEX, re-check the official whitepaper and replace third-party derivations with exact primary-source citations wherever possible.
