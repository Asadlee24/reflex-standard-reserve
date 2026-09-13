# Launch review and model limits

Reviewed on 13 September 2026. REFLEX remains an independent prototype with known differences from the current Standard Reserve design.

## Current primary references

The [official mint page](https://www.standardreserve.xyz/app/mint/) provides the eligibility checker. The [mint announcement](https://x.com/standard_rsv/status/2098969964283846751) specifies a 0.15 ETH whitelist liquidity fee. The [schedule](https://x.com/standard_rsv/status/2098969968201359736) describes a public Dutch auction for remaining Genesis supply after the whitelist period. It opens at 1.25 ETH and descends toward 0.15 ETH over 30 minutes.

The announcement uses EST. An official UTC clarification is needed before treating a local timezone conversion as final.

## Scope of the published design

The [whitepaper v0.1](https://www.standardreserve.xyz/whitepaper/) explicitly describes itself as a design overview. It is not an implementation specification. These comparisons concern published design statements, not independently verified deployed behavior.

| Topic | Published design | REFLEX limitation |
| --- | --- | --- |
| Auctions | Sections 7 and 8 describe Dutch auctions. | The existing Solidity auction model and historical references use a sealed-bid design. This model has not been updated to match. |
| Final branch | Sections 6 and 9 end the charter when its last branch is retired. | The JavaScript reference model moves it to Dormant. That is a known mismatch, not a protocol finding. |
| Mint proceeds | The launch announcement allocates all mint proceeds to liquidity and vaults. | Keep this separate from the regular fee split described in section 11, which includes a 15% team share. |
| Transferability | Section 12 describes charters as initially soulbound. | A future transfer switch does not make launch charters transferable. |

## Evidence correction

Previous generated metadata included fixed success flags, a fixed source commit, fuzz counts and duration. Those values were not linked to an execution record. They have been removed. Registry export now reports `NOT_RUN` with null execution metrics, and authored trace examples report `ILLUSTRATIVE` with unevaluated steps.

The source matrix and earlier research notes are historical model assumptions under review. `NEEDS_REVIEW` does not imply an error in every rule; it means source mapping and implementation equivalence have not been established.

The sandbox calculates state checks in the browser. The results refer only to its simulated model state. Node test success is separate from a Foundry run, and neither is a formal proof of the official protocol.

## Remaining work

1. Reconcile the auction and charter lifecycle models with primary sources.
2. Test the same JavaScript engine that the browser imports.
3. Complete and execute the Solidity harness with actual result capture.
4. Map each result to an exact implementation, command, source commit and run record.
5. Build a differential adapter only after the official implementation is independently identified.

No security vulnerability in the official protocol is asserted by these model differences.
