# Launch review and model limits

Reviewed 13 September 2026 against the [official whitepaper v0.1](https://www.standardreserve.xyz/whitepaper/). This is a published design overview, not deployed-code verification.

## Corrected behavior

| Topic | Published design | REFLEX implementation |
| --- | --- | --- |
| Daily auctions | Sections 7–8: falling-price Dutch purchases, instant allocation, no final-price refunds | `AuctionSpec` purchases at the current configured price, caps supply, rejects expired sales and preserves earlier receipts. Licence payments burn STANDARD. |
| Auction curve | Sections 7–8: exponential decay for daily auctions | The Solidity model uses explicit decreasing time/price points as a discrete abstraction. It does not reproduce the official fixed-point curve or predict Genesis prices. |
| Charter lifecycle | Sections 6 and 9: retire the final branch and burn the Charter | JavaScript and Solidity make the final exit terminal. Capacity consumed by retirement cannot be reused without another licence. |
| Entry and branch cap | Sections 6–7: first branch included, up to ten branches | Browser entry and Solidity `BranchSpec.createCharter` include one branch. Capacity is capped at ten. `CharterSpec.createCharter` remains a low-level setup primitive used by the wrapper and fixtures. |
| Supply | Section 3: 1B cap, 100M genesis liquidity, 900M issuance budget | Browser defaults and Solidity fixture defaults match these figures. Small test/example fixtures deliberately use custom sizes. |
| Zero flow | Section 5: zero flow is contraction | Corrected in JavaScript and Solidity. |

## Genesis is separate from daily auctions

The [mint announcement](https://x.com/standard_rsv/status/2098969964283846751) and [schedule](https://x.com/standard_rsv/status/2098969968201359736) describe the whitelist and remaining Genesis supply. The recorded announcement describes a 0.15 ETH WL liquidity fee and a 30-minute public auction starting at 1.25 ETH and descending toward 0.15 ETH. Use the [official mint page](https://www.standardreserve.xyz/app/mint/) to confirm eligibility and current terms.

These announced figures are documentation, not executable Genesis configuration. No Genesis decay formula, refund rule, exact UTC start, wallet allocation or contract address is guessed by the model. The announcement uses EST; clarify the intended offset before converting it. Remaining public supply depends on actual WL mints, not just the number of WL wallets.

Genesis proceeds go to initial liquidity and vaults. Do not apply the regular section 11 fee split, including its team share, to Genesis. Charters start soulbound; a possible future transfer switch does not establish resale availability at launch.

## Explicit abstractions

- The Solidity files are permissionless reference fixtures, not deployable financial contracts. Auction ETH is a simulated balance ledger. No actual ETH is accepted or routed.
- A licence auction fixture represents one day. Its three-licence limit is per Charter per auction; a production daily scheduler and global day accounting are absent.
- Auction points and durations must be supplied explicitly. No fixed Genesis mint schedule or sell-out forecast is provided.
- Browser branch additions allocate fixture licences without debiting payment. Browser and BranchSpec withdrawals demonstrate gross accrual accounting and omit the resolution fee integration. The independent ResolutionSpec math tests do not establish integrated withdrawal correctness.
- The browser uses integer whole-token amounts, not Solidity wei precision. It rejects unsafe and invalid numeric inputs.
- The policy multiplier formula remains illustrative. Only zero-flow classification was corrected; trailing-epoch issuance, cooldowns and launch bounds are not claimed to match production.
- The model does not predict profits, NFT floor prices or actual participant behavior. There is no official-contract differential adapter.

## Evidence

Registry export is still authored data: `NOT_RUN`, null run metrics and `UNVERIFIED` candidates. It must not manufacture passing counts. Trace Lab examples are illustrative fixtures, not captured fuzz traces. Source mappings outside the specifically reviewed rules remain `NEEDS_REVIEW`.

The current Node tests import the same engine as the browser. The Foundry handler is explicitly targeted and exercises creation, expansion, accrual and retirement. Unit tests separately exercise auction timing, supply, payment, failures, burns and terminal lifecycle.

See [validation](VALIDATION.md) and `validation/latest.json` for actual execution records. A successful run validates the listed reference-model tests, not the complete registry or the official protocol.
