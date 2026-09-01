// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {SpecTypes} from "./SpecTypes.sol";
import {CharterSpec} from "./CharterSpec.sol";
import {StandardSpec} from "./StandardSpec.sol";

/**
 * @title BranchSpec
 * @notice Executable reference specification for Branch lifecycle, capacity constraints, and resolutions.
 * @author Asad Lee (https://github.com/Asadlee24)
 * @dev Corresponds to Source Rules: SR-BRANCH-001, SR-BRANCH-002, SR-BRANCH-003, SR-BRANCH-004.
 */
contract BranchSpec {
    CharterSpec public immutable charterContract;
    StandardSpec public immutable standardToken;

    uint256 public nextBranchId = 1;
    mapping(uint256 => SpecTypes.Branch) public branches;
    mapping(uint256 => uint256[]) public charterBranchIds;

    event BranchOpened(uint256 indexed branchId, uint256 indexed charterId, uint256 epoch);
    event BranchResolved(uint256 indexed branchId, uint256 indexed charterId, uint256 totalRealized, uint256 epoch);
    event IssuanceAccrued(uint256 indexed branchId, uint256 amount);

    error BranchNotActive(uint256 branchId, SpecTypes.BranchStatus status);
    error BranchAlreadyResolved(uint256 branchId);
    error InsufficientAccrual(uint256 branchId, uint256 available, uint256 requested);

    constructor(address _charterContract, address _standardToken) {
        charterContract = CharterSpec(_charterContract);
        standardToken = StandardSpec(_standardToken);
    }

    /**
     * @notice Activates a new operational Branch under a Charter.
     * @dev Enforces SR-BRANCH-001 & INV-BRANCH-001.
     */
    function openBranch(uint256 charterId, uint256 currentEpoch) external returns (uint256 branchId) {
        charterContract.registerBranchAddition(charterId);

        branchId = nextBranchId++;
        branches[branchId] = SpecTypes.Branch({
            id: branchId,
            charterId: charterId,
            status: SpecTypes.BranchStatus.Active,
            accruedIssuance: 0,
            totalRealized: 0,
            creationEpoch: currentEpoch,
            resolutionEpoch: 0
        });

        charterBranchIds[charterId].push(branchId);
        emit BranchOpened(branchId, charterId, currentEpoch);
    }

    /**
     * @notice Accrues protocol issuance to an active branch.
     * @dev Enforces SR-ISSUANCE-001 & INV-BRANCH-002.
     */
    function accrueIssuance(uint256 branchId, uint256 amount) external {
        SpecTypes.Branch storage b = branches[branchId];
        if (b.status != SpecTypes.BranchStatus.Active) {
            revert BranchNotActive(branchId, b.status);
        }
        standardToken.registerAccrual(amount);
        b.accruedIssuance += amount;
        emit IssuanceAccrued(branchId, amount);
    }

    /**
     * @notice Resolves/retires a branch, realizing remaining accrual and transitioning state.
     * @dev Enforces SR-BRANCH-003, SR-BRANCH-004, INV-BRANCH-002, INV-BRANCH-003.
     */
    function resolveBranch(uint256 branchId, uint256 currentEpoch, address recipient) external returns (uint256 realizedAmount) {
        SpecTypes.Branch storage b = branches[branchId];
        if (b.status == SpecTypes.BranchStatus.Resolved) {
            revert BranchAlreadyResolved(branchId);
        }
        if (b.status != SpecTypes.BranchStatus.Active) {
            revert BranchNotActive(branchId, b.status);
        }

        b.status = SpecTypes.BranchStatus.Resolved;
        b.resolutionEpoch = currentEpoch;

        realizedAmount = b.accruedIssuance;
        b.accruedIssuance = 0;
        b.totalRealized += realizedAmount;

        charterContract.registerBranchRemoval(b.charterId);

        if (realizedAmount > 0) {
            standardToken.realizeAccrual(recipient, realizedAmount);
        }

        emit BranchResolved(branchId, b.charterId, realizedAmount, currentEpoch);
    }

    function getBranch(uint256 branchId) external view returns (SpecTypes.Branch memory) {
        return branches[branchId];
    }
}
