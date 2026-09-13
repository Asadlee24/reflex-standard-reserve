// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {SpecHelper} from "../helpers/SpecHelper.sol";
import {AuctionSpec} from "../../src/spec/AuctionSpec.sol";
import {SpecTypes} from "../../src/spec/SpecTypes.sol";
interface Vm { function warp(uint256) external; function expectRevert() external; }

contract LaunchModelTest is SpecHelper {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function setUp() public { setUpFixture(); }
    // Explicit teaching schedule. These prices/times are not Genesis configuration.
    function auction(bool licence, uint256 supply) internal returns (uint256 id) {
        AuctionSpec.PricePoint[] memory p = new AuctionSpec.PricePoint[](3);
        p[0] = AuctionSpec.PricePoint(0, 100);
        p[1] = AuctionSpec.PricePoint(50, 60);
        p[2] = AuctionSpec.PricePoint(90, 20);
        id = auctionContract.createAuction(licence, 1000, 100, supply, p);
    }
    function testBuyAtCurrentPriceWithoutRepricingPreviousPurchase() public {
        uint256 id = auction(false, 2);
        auctionContract.creditEthFixture(banker1, 200);
        auctionContract.creditEthFixture(banker2, 200);
        vm.warp(1000);
        (uint256 c1, uint256 paid1) = auctionContract.purchase(id, banker1, 0, 100);
        require(paid1 == 100 && charterContract.getCharter(c1).activeBranches == 1, "First purchase");
        vm.warp(1050);
        (, uint256 paid2) = auctionContract.purchase(id, banker2, 0, 100);
        require(paid2 == 60, "Current price");
        require(auctionContract.ethBalances(banker1) == 100, "No final price rebate");
        require(auctionContract.ethProceeds() == 160, "Proceeds conservation");
        vm.expectRevert(); auctionContract.purchase(id, banker1, 0, 100);
    }
    function testTimeWindowSlippageAndFundsFailuresDoNotConsumeSupply() public {
        uint256 id = auction(false, 3);
        auctionContract.creditEthFixture(banker1, 100);
        vm.warp(999);
        vm.expectRevert(); auctionContract.purchase(id, banker1, 0, 100);
        vm.warp(1000);
        vm.expectRevert(); auctionContract.purchase(id, banker1, 0, 99);
        vm.expectRevert(); auctionContract.purchase(id, banker2, 0, 100);
        (,,,,,uint256 sold,uint256 proceeds) = auctionContract.auctions(id);
        require(sold == 0 && proceeds == 0 && charterContract.nextCharterId() == 1, "Atomic failure");
        vm.warp(1100);
        vm.expectRevert(); auctionContract.purchase(id, banker1, 0, 100);
    }
    function testFuzzPriceNeverRises(uint256 a, uint256 b) public {
        uint256 id = auction(false, 1);
        a = a % 101; b = b % 101;
        if (a > b) (a,b) = (b,a);
        vm.warp(1000+a); uint256 first = auctionContract.currentPrice(id);
        vm.warp(1000+b); uint256 second = auctionContract.currentPrice(id);
        require(second <= first && second >= 20 && first <= 100, "Monotone bounded price");
    }
    function testRejectRisingScheduleAndUnknownAuction() public {
        AuctionSpec.PricePoint[] memory p = new AuctionSpec.PricePoint[](2);
        p[0] = AuctionSpec.PricePoint(0, 20); p[1] = AuctionSpec.PricePoint(1, 100);
        vm.expectRevert(); auctionContract.createAuction(false, 1000, 100, 1, p);
        vm.expectRevert(); auctionContract.currentPrice(999);
        require(auctionContract.nextAuctionId() == 1, "Failed creation must roll back");
    }
    function testLicenceBurnDeliveryAndPerAuctionLimit() public {
        uint256 c = branchContract.createCharter(banker1, 1);
        standardToken.registerAccrual(1000);
        standardToken.realizeAccrual(banker1, 1000);
        uint256 id = auction(true, 10);
        vm.warp(1000);
        uint256 burnedBefore = standardToken.totalBurned();
        for (uint256 i; i < 3; ++i) auctionContract.purchase(id, banker1, c, 100);
        require(standardToken.totalBurned() - burnedBefore == 300, "Full licence burn");
        require(charterContract.getCharter(c).activeBranches == 4, "Immediate branches");
        vm.expectRevert(); auctionContract.purchase(id, banker1, c, 100);
        vm.expectRevert(); auctionContract.purchase(id, banker2, c, 100);
        require(standardToken.verifyAccountingInvariant(), "Accounting");
    }
    function testLastBranchBurnIsTerminalAndInvalidChartersCannotExpand() public {
        uint256 c = branchContract.createCharter(banker1, 1);
        charterContract.expandCapacity(c, 1);
        uint256 b2 = branchContract.openBranch(c, 1);
        branchContract.accrueIssuance(1, 100);
        branchContract.resolveBranch(1, 2, banker1);
        require(charterContract.getCharter(c).status == SpecTypes.CharterStatus.Active, "Partial exit");
        vm.expectRevert(); branchContract.openBranch(c, 2);
        branchContract.resolveBranch(b2, 2, banker1);
        require(charterContract.getCharter(c).status == SpecTypes.CharterStatus.Burned, "Final exit");
        vm.expectRevert(); charterContract.expandCapacity(c, 1);
        vm.expectRevert(); branchContract.openBranch(c, 2);
        vm.expectRevert(); branchContract.resolveBranch(b2, 2, banker1);
        vm.expectRevert(); charterContract.expandCapacity(999, 1);
        require(standardToken.verifyAccountingInvariant(), "Accounting");
    }
    function testTenBranchCapAndZeroFlowContraction() public {
        uint256 c = branchContract.createCharter(banker1, 1);
        charterContract.expandCapacity(c, 9);
        for (uint256 i; i < 9; ++i) branchContract.openBranch(c, 1);
        vm.expectRevert(); charterContract.expandCapacity(c, 1);
        vm.expectRevert(); branchContract.openBranch(c, 1);
        vm.warp(block.timestamp + 86400);
        policyContract.advanceEpoch(0);
        require(policyContract.currentRegime() == SpecTypes.PolicyRegime.Contraction, "Zero is contraction");
        vm.warp(block.timestamp + 86400);
        policyContract.advanceEpoch(type(int256).min);
        require(policyContract.currentRegime() == SpecTypes.PolicyRegime.Contraction, "Minimum signed flow");
    }
}
