// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {StandardSpec} from "./StandardSpec.sol";
import {CharterSpec} from "./CharterSpec.sol";

/**
 * @title AuctionSpec
 * @notice Reference specification for Expansion Licence and Charter auctions.
 * @author Asad Lee (https://github.com/Asadlee24)
 * @dev Corresponds to Source Rules: SR-AUCTION-001, SR-AUCTION-002, INV-AUCTION-001.
 */
contract AuctionSpec {
    struct Auction {
        uint256 id;
        bool isExpansionLicence; // true = Licence, false = Charter
        uint256 targetId; // Charter ID if licence
        uint256 capacityUnits;
        uint256 reservePrice;
        address highestBidder;
        uint256 highestBid;
        bool settled;
    }

    StandardSpec public immutable standardToken;
    CharterSpec public immutable charterContract;

    uint256 public nextAuctionId = 1;
    mapping(uint256 => Auction) public auctions;

    event AuctionCreated(uint256 indexed auctionId, bool isExpansionLicence, uint256 reservePrice);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 winningBid);

    error AuctionAlreadySettled(uint256 auctionId);
    error BidBelowReserve(uint256 bid, uint256 reserve);
    error BidNotHigher(uint256 bid, uint256 currentHighest);

    constructor(address _standardToken, address _charterContract) {
        standardToken = StandardSpec(_standardToken);
        charterContract = CharterSpec(_charterContract);
    }

    function createAuction(bool isLicence, uint256 targetCharterId, uint256 capacity, uint256 reserve) external returns (uint256 auctionId) {
        auctionId = nextAuctionId++;
        auctions[auctionId] = Auction({
            id: auctionId,
            isExpansionLicence: isLicence,
            targetId: targetCharterId,
            capacityUnits: capacity,
            reservePrice: reserve,
            highestBidder: address(0),
            highestBid: 0,
            settled: false
        });
        emit AuctionCreated(auctionId, isLicence, reserve);
    }

    function bid(uint256 auctionId, address bidder, uint256 amount) external {
        Auction storage a = auctions[auctionId];
        if (a.settled) revert AuctionAlreadySettled(auctionId);
        if (amount < a.reservePrice) revert BidBelowReserve(amount, a.reservePrice);
        if (amount <= a.highestBid) revert BidNotHigher(amount, a.highestBid);

        a.highestBidder = bidder;
        a.highestBid = amount;
        emit BidPlaced(auctionId, bidder, amount);
    }

    /**
     * @notice Settles auction and awards capacity / charter.
     * @dev Enforces SR-AUCTION-002 & INV-AUCTION-001.
     */
    function settle(uint256 auctionId) external {
        Auction storage a = auctions[auctionId];
        if (a.settled) revert AuctionAlreadySettled(auctionId);
        require(a.highestBidder != address(0), "No bids to settle");

        a.settled = true;

        if (a.isExpansionLicence) {
            // Burn bid tokens as licence consideration
            standardToken.burn(a.highestBidder, a.highestBid);
            charterContract.expandCapacity(a.targetId, a.capacityUnits);
        } else {
            charterContract.createCharter(a.highestBidder, a.capacityUnits);
        }

        emit AuctionSettled(auctionId, a.highestBidder, a.highestBid);
    }
}
