// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title SpecTypes
 * @notice Shared types, enums, and data structures for REFLEX SpecLab reference specification.
 * @author Asad Lee (https://github.com/Asadlee24)
 * @dev Modeled strictly from Standard Reserve Whitepaper v1 and primary source disclosures.
 */
library SpecTypes {
    enum CharterStatus {
        NonExistent,
        Active,
        Dormant,
        Burned
    }

    enum BranchStatus {
        NonExistent,
        Active,
        Resolving,
        Resolved
    }

    enum PolicyRegime {
        Expansion,
        Contraction
    }

    enum FailureType {
        None,
        ReferenceModelBug,
        AssumptionFailure,
        AmbiguousSpec,
        CandidateCounterexample,
        HarnessError,
        ImplementationDivergence
    }

    struct Charter {
        uint256 id;
        address owner;
        CharterStatus status;
        uint256 maxBranches;
        uint256 activeBranches;
        uint256 totalBranchesCreated;
    }

    struct Branch {
        uint256 id;
        uint256 charterId;
        BranchStatus status;
        uint256 accruedIssuance;
        uint256 totalRealized;
        uint256 creationEpoch;
        uint256 resolutionEpoch;
    }

    struct PolicyConfig {
        uint256 feeFloor; // 1e18 scale (e.g. 0.02e18 = 2%)
        uint256 feeCeiling; // 1e18 scale (e.g. 0.40e18 = 40%)
        uint256 feeSaturation; // 1e18 scale (e.g. 0.50e18 = 50%)
        uint256 epochDuration; // in seconds
        uint256 maxSupply; // Total token hard cap
    }

    struct FeeSplit {
        uint256 grossFee;
        uint256 burned;
        uint256 redistributed;
    }
}
