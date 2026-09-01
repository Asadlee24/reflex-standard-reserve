// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {SpecTypes} from "./SpecTypes.sol";

/**
 * @title CharterSpec
 * @notice Executable reference specification for Founding Charters, Bankers, and capacity lifecycle.
 * @author Asad Lee (https://github.com/Asadlee24)
 * @dev Corresponds to Source Rules: SR-CHARTER-001, SR-CHARTER-002, SR-CHARTER-003.
 */
contract CharterSpec {
    uint256 public nextCharterId = 1;
    mapping(uint256 => SpecTypes.Charter) public charters;
    mapping(address => uint256[]) public ownerCharters;

    event CharterCreated(uint256 indexed charterId, address indexed owner, uint256 maxBranches);
    event CharterStatusChanged(uint256 indexed charterId, SpecTypes.CharterStatus newStatus);
    event CharterCapacityExpanded(uint256 indexed charterId, uint256 newMaxBranches);

    error InvalidOwner();
    error InvalidCharter(uint256 charterId);
    error CharterNotActive(uint256 charterId, SpecTypes.CharterStatus status);
    error CannotDestroyActiveCharter(uint256 charterId, uint256 activeBranches);

    /**
     * @notice Mints a new Charter instance (Founding or Auctioned).
     * @dev Enforces SR-CHARTER-001.
     */
    function createCharter(address owner, uint256 initialCapacity) external returns (uint256 charterId) {
        if (owner == address(0)) revert InvalidOwner();
        require(initialCapacity > 0, "Capacity must be > 0");

        charterId = nextCharterId++;
        charters[charterId] = SpecTypes.Charter({
            id: charterId,
            owner: owner,
            status: SpecTypes.CharterStatus.Active,
            maxBranches: initialCapacity,
            activeBranches: 0,
            totalBranchesCreated: 0
        });

        ownerCharters[owner].push(charterId);
        emit CharterCreated(charterId, owner, initialCapacity);
    }

    /**
     * @notice Registers branch addition under Charter.
     * @dev Enforces SR-BRANCH-002 & INV-BRANCH-001.
     */
    function registerBranchAddition(uint256 charterId) external {
        SpecTypes.Charter storage c = charters[charterId];
        if (c.status != SpecTypes.CharterStatus.Active) {
            revert CharterNotActive(charterId, c.status);
        }
        require(c.activeBranches < c.maxBranches, "Exceeds max branch capacity");
        c.activeBranches += 1;
        c.totalBranchesCreated += 1;
    }

    /**
     * @notice Registers branch resolution under Charter.
     * @dev Enforces INV-CHARTER-002.
     */
    function registerBranchRemoval(uint256 charterId) external {
        SpecTypes.Charter storage c = charters[charterId];
        require(c.activeBranches > 0, "No active branches to remove");
        c.activeBranches -= 1;
        if (c.activeBranches == 0) {
            c.status = SpecTypes.CharterStatus.Dormant;
            emit CharterStatusChanged(charterId, SpecTypes.CharterStatus.Dormant);
        }
    }

    /**
     * @notice Expands Charter maximum branch capacity via Expansion Licence.
     */
    function expandCapacity(uint256 charterId, uint256 additionalCapacity) external {
        SpecTypes.Charter storage c = charters[charterId];
        if (c.status == SpecTypes.CharterStatus.Burned) {
            revert CharterNotActive(charterId, c.status);
        }
        c.maxBranches += additionalCapacity;
        if (c.status == SpecTypes.CharterStatus.Dormant) {
            c.status = SpecTypes.CharterStatus.Active;
            emit CharterStatusChanged(charterId, SpecTypes.CharterStatus.Active);
        }
        emit CharterCapacityExpanded(charterId, c.maxBranches);
    }

    /**
     * @notice Permanently burns/destroys a dormant Charter.
     * @dev Enforces INV-CHARTER-001.
     */
    function destroyCharter(uint256 charterId) external {
        SpecTypes.Charter storage c = charters[charterId];
        if (c.activeBranches > 0) {
            revert CannotDestroyActiveCharter(charterId, c.activeBranches);
        }
        c.status = SpecTypes.CharterStatus.Burned;
        emit CharterStatusChanged(charterId, SpecTypes.CharterStatus.Burned);
    }

    function getCharter(uint256 charterId) external view returns (SpecTypes.Charter memory) {
        return charters[charterId];
    }
}
