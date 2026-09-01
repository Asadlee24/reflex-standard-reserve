// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {StandardSpec} from "../../src/spec/StandardSpec.sol";
import {CharterSpec} from "../../src/spec/CharterSpec.sol";
import {BranchSpec} from "../../src/spec/BranchSpec.sol";
import {ResolutionSpec} from "../../src/spec/ResolutionSpec.sol";
import {PolicySpec} from "../../src/spec/PolicySpec.sol";
import {AuctionSpec} from "../../src/spec/AuctionSpec.sol";
import {SpecTypes} from "../../src/spec/SpecTypes.sol";

/**
 * @title ProtocolHandler
 * @notice Randomized state-transition handler for Foundry multi-action invariant testing.
 * @author Asad Lee (https://github.com/Asadlee24)
 * @dev Explores complex interleavings: createCharter -> openBranch -> accrue -> resolve -> advanceEpoch -> settleAuction.
 */
contract ProtocolHandler {
    StandardSpec public immutable standardToken;
    CharterSpec public immutable charterContract;
    BranchSpec public immutable branchContract;
    ResolutionSpec public immutable resolutionContract;
    PolicySpec public immutable policyContract;
    AuctionSpec public immutable auctionContract;

    uint256[] public activeCharterIds;
    uint256[] public activeBranchIds;
    uint256 public sequenceCallCount;

    constructor(
        address _standard,
        address _charter,
        address _branch,
        address _resolution,
        address _policy,
        address _auction
    ) {
        standardToken = StandardSpec(_standard);
        charterContract = CharterSpec(_charter);
        branchContract = BranchSpec(_branch);
        resolutionContract = ResolutionSpec(_resolution);
        policyContract = PolicySpec(_policy);
        auctionContract = AuctionSpec(_auction);
    }

    function createCharter(uint256 capacitySeed) external returns (uint256 charterId) {
        sequenceCallCount++;
        uint256 capacity = 1 + (capacitySeed % 10);
        address owner = address(uint160(0x1000 + sequenceCallCount));
        charterId = charterContract.createCharter(owner, capacity);
        activeCharterIds.push(charterId);
    }

    function openBranch(uint256 charterIndexSeed) external returns (uint256 branchId) {
        if (activeCharterIds.length == 0) return 0;
        sequenceCallCount++;
        uint256 charterId = activeCharterIds[charterIndexSeed % activeCharterIds.length];
        SpecTypes.Charter memory c = charterContract.getCharter(charterId);
        if (c.status != SpecTypes.CharterStatus.Active || c.activeBranches >= c.maxBranches) {
            return 0;
        }
        branchId = branchContract.openBranch(charterId, policyContract.currentEpoch());
        activeBranchIds.push(branchId);
    }

    function accrueIssuance(uint256 branchIndexSeed, uint256 amountSeed) external {
        if (activeBranchIds.length == 0) return;
        sequenceCallCount++;
        uint256 branchId = activeBranchIds[branchIndexSeed % activeBranchIds.length];
        SpecTypes.Branch memory b = branchContract.getBranch(branchId);
        if (b.status != SpecTypes.BranchStatus.Active) return;

        uint256 remainingBudget = standardToken.remainingIssuanceBudget();
        if (remainingBudget == 0) return;

        uint256 amount = 1e18 + (amountSeed % (remainingBudget > 100_000e18 ? 100_000e18 : remainingBudget));
        if (amount > remainingBudget) amount = remainingBudget;

        branchContract.accrueIssuance(branchId, amount);
    }

    function resolveBranch(uint256 branchIndexSeed) external {
        if (activeBranchIds.length == 0) return;
        sequenceCallCount++;
        uint256 idx = branchIndexSeed % activeBranchIds.length;
        uint256 branchId = activeBranchIds[idx];
        SpecTypes.Branch memory b = branchContract.getBranch(branchId);
        if (b.status != SpecTypes.BranchStatus.Active) return;

        address recipient = address(uint160(0x2000 + branchId));
        branchContract.resolveBranch(branchId, policyContract.currentEpoch(), recipient);

        // Remove from active branches array
        activeBranchIds[idx] = activeBranchIds[activeBranchIds.length - 1];
        activeBranchIds.pop();
    }
}
