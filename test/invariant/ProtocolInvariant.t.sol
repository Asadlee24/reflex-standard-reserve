// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {SpecHelper} from "../helpers/SpecHelper.sol";
import {ProtocolHandler} from "../handlers/ProtocolHandler.sol";
import {SpecTypes} from "../../src/spec/SpecTypes.sol";

/**
 * @title ProtocolInvariantTest
 * @notice Foundry invariant test suite verifying system-level state conservation and rules.
 * @author Asad Lee (https://github.com/Asadlee24)
 */
contract ProtocolInvariantTest is SpecHelper {
    ProtocolHandler public handler;

    function setUp() public {
        setUpFixture();
        handler = new ProtocolHandler(
            address(standardToken),
            address(charterContract),
            address(branchContract),
            address(resolutionContract),
            address(policyContract),
            address(auctionContract)
        );
    }

    /**
     * @notice Invariant INV-SUPPLY-001: Circulating supply + Unminted Accruals <= MAX_SUPPLY.
     */
    function invariant_SupplyHardCap() public view {
        uint256 totalCommitted = standardToken.circulatingSupply() + standardToken.totalUnmintedAccrual();
        require(totalCommitted <= standardToken.MAX_SUPPLY(), "INV-SUPPLY-001: Committed supply exceeds hard cap");
    }

    /**
     * @notice Invariant INV-ACCOUNTING-001: Accounting equation reconciles exactly.
     */
    function invariant_AccountingConservation() public view {
        uint256 total = standardToken.circulatingSupply() 
            + standardToken.totalBurned() 
            + standardToken.totalUnmintedAccrual() 
            + standardToken.remainingIssuanceBudget();
        require(total == standardToken.MAX_SUPPLY(), "INV-ACCOUNTING-001: Accounting mismatch");
    }

    /**
     * @notice Invariant INV-RESOLUTION-001: Fee is strictly within [Floor, Ceiling].
     */
    function invariant_FeeBounds() public view {
        uint256 fee0 = resolutionContract.computeResolutionFee(0);
        uint256 fee50 = resolutionContract.computeResolutionFee(0.5e18);
        uint256 fee100 = resolutionContract.computeResolutionFee(1e18);

        require(fee0 >= 0.02e18 && fee0 <= 0.40e18, "INV-RESOLUTION-001: Floor violated");
        require(fee50 >= 0.02e18 && fee50 <= 0.40e18, "INV-RESOLUTION-001: Midpoint violated");
        require(fee100 <= 0.40e18, "INV-RESOLUTION-001: Ceiling violated");
    }
}
