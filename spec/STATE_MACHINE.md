# REFLEX reference state machines

These are research abstractions. See [launch review](../research/LAUNCH_REVIEW.md) for source mappings and omitted economics.

## Charter and Branch

High-level creation includes a first active branch. Solidity `CharterSpec.createCharter` is a low-level setup primitive; `BranchSpec.createCharter` composes creation with branch activation atomically.

A Charter remains Active while branches remain. Retiring a branch consumes its allocated capacity. Retiring the last branch changes the Charter directly to Burned. Burned Charters cannot expand or open branches; re-entry creates a new Charter. No Dormant reactivation is modeled. This is distinct from the whitepaper's inactive-wallet/dormant-banker procedure, which is not implemented here.

A Branch transitions from Active to Resolved exactly once. Accrual cannot be added after resolution. Gross internal accrual becomes a simulated token balance on retirement. Integrated resolution fees are outside this fixture.

| Action | Preconditions | Result |
| --- | --- | --- |
| Create Charter | Valid owner | One active branch and one allocated capacity unit |
| Allocate licence fixture | Active Charter; capacity below ten | One additional capacity unit |
| Open Branch | Active Charter; unused allocated capacity | One new active branch |
| Retire Branch | Active Branch | Resolve once; decrease active count and capacity; burn Charter if final branch |
| Accrue | Active Branch; nonnegative amount within remaining budget | Budget moves into unminted accrual |
| Burn | Nonnegative amount within simulated balance | Circulation falls; issuance budget does not replenish |

## Dutch auction

The explicit time/price schedule must start at offset zero, have strictly increasing offsets before expiry, and positive non-increasing prices. The model does not invent official curve parameters.

Purchases are allowed during `[startsAt, startsAt + duration)` while supply remains. A successful purchase charges the current price, consumes one unit and immediately delivers a Charter with its first branch or a paid licence branch. Licence payments burn STANDARD; Charter payments debit a simulated ETH ledger.

A buyer's maximum price is a spending limit, not a bid. There is no highest bidder, later settlement or final clearing-price rebate. A failed purchase rolls back balances, supply and delivered state. Unsold expired units do not carry into another auction. See unit tests for boundary and failure cases.

## Policy

Positive current flow is Expansion; negative or zero current flow is Contraction. This describes the fixture's regime classification. It does not reproduce the official trailing-epoch issuance algorithm. Multiplier values in PolicySpec remain explicitly illustrative.
