// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {StandardSpec} from "./StandardSpec.sol";
import {CharterSpec} from "./CharterSpec.sol";
import {BranchSpec} from "./BranchSpec.sol";
import {SpecTypes} from "./SpecTypes.sol";

/**
 * @title AuctionSpec
 * @author Asad Lee
 * @notice Research-only Dutch purchase state machine. Never deploy with real funds.
 * @dev The explicit monotone schedule is a discrete abstraction, NOT the official
 * exponential implementation or a Genesis price prediction. Do not mix daily and
 * Genesis parameters. ETH is a simulated ledger. No bids, escrow or final-price rebates.
 * Fixture setters are intentionally permissionless. This is not production code.
 */
contract AuctionSpec {
    struct PricePoint { uint256 offset; uint256 price; }
    struct Auction {
        bool exists;
        bool isExpansionLicence;
        uint256 startsAt;
        uint256 duration;
        uint256 supply;
        uint256 sold;
        uint256 proceeds;
    }
    StandardSpec public immutable standardToken;
    CharterSpec public immutable charterContract;
    BranchSpec public immutable branchContract;
    uint256 public nextAuctionId = 1;
    uint256 public ethProceeds;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => PricePoint[]) private schedules;
    mapping(address => uint256) public ethBalances;
    mapping(uint256 => mapping(uint256 => uint256)) public licencesPurchased;
    event Purchased(uint256 indexed auctionId, address indexed buyer, uint256 price, uint256 charterId);

    constructor(address token, address charter, address branch) {
        standardToken = StandardSpec(token);
        charterContract = CharterSpec(charter);
        branchContract = BranchSpec(branch);
    }
    function creditEthFixture(address buyer, uint256 amount) external {
        require(buyer != address(0), "Invalid buyer");
        ethBalances[buyer] += amount;
    }
    function createAuction(bool isLicence, uint256 startsAt, uint256 duration, uint256 supply, PricePoint[] calldata points)
        external returns (uint256 id)
    {
        require(duration > 0 && supply > 0 && points.length > 0, "Invalid auction");
        require(startsAt <= type(uint256).max - duration, "Invalid end time");
        require(points[0].offset == 0, "Schedule must start at zero");
        id = nextAuctionId++;
        for (uint256 i; i < points.length; ++i) {
            require(points[i].price > 0 && points[i].offset < duration, "Invalid price point");
            if (i > 0) {
                require(points[i].offset > points[i - 1].offset, "Offsets must increase");
                require(points[i].price <= points[i - 1].price, "Price must not increase");
            }
            schedules[id].push(points[i]);
        }
        auctions[id] = Auction(true, isLicence, startsAt, duration, supply, 0, 0);
    }
    function currentPrice(uint256 id) public view returns (uint256) {
        Auction memory a = auctions[id];
        require(a.exists, "Unknown auction");
        uint256 elapsed = block.timestamp > a.startsAt ? block.timestamp - a.startsAt : 0;
        PricePoint[] storage points = schedules[id];
        uint256 price = points[0].price;
        for (uint256 i = 1; i < points.length && points[i].offset <= elapsed; ++i) price = points[i].price;
        return price;
    }
    // Charge the current price and deliver one unit atomically. Expired supply does not roll over.
    function purchase(uint256 id, address buyer, uint256 targetCharter, uint256 maxPrice)
        external returns (uint256 charterId, uint256 paid)
    {
        Auction storage a = auctions[id];
        require(a.exists, "Unknown auction");
        require(buyer != address(0), "Invalid buyer");
        require(block.timestamp >= a.startsAt && block.timestamp < a.startsAt + a.duration, "Auction not open");
        require(a.sold < a.supply, "Sold out");
        paid = currentPrice(id);
        require(paid <= maxPrice, "Price exceeds limit");
        a.sold += 1;
        a.proceeds += paid;
        if (a.isExpansionLicence) {
            SpecTypes.Charter memory c = charterContract.getCharter(targetCharter);
            require(c.owner == buyer && c.status == SpecTypes.CharterStatus.Active, "Invalid target Charter");
            require(licencesPurchased[id][targetCharter] < 3, "Daily licence limit");
            licencesPurchased[id][targetCharter] += 1;
            standardToken.burn(buyer, paid);
            charterContract.expandCapacity(targetCharter, 1);
            branchContract.openBranch(targetCharter, 0); // Epoch metadata is outside this fixture.
            charterId = targetCharter;
        } else {
            require(ethBalances[buyer] >= paid, "Insufficient simulated ETH");
            ethBalances[buyer] -= paid;
            ethProceeds += paid; // Downstream vault routing is outside this fixture.
            charterId = branchContract.createCharter(buyer, 0);
        }
        emit Purchased(id, buyer, paid, charterId);
    }
}
