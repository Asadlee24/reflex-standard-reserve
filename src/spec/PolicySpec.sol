// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {SpecTypes} from "./SpecTypes.sol";

/**
 * @title PolicySpec
 * @notice Executable reference specification for Monetary Regimes, Epochs, and Multiplier bounds.
 * @author Asad Lee (https://github.com/Asadlee24)
 * @dev Corresponds to Source Rules: SR-POLICY-001, SR-POLICY-002, SR-POLICY-003, SR-POLICY-004.
 */
contract PolicySpec {
    uint256 public constant SCALE = 1e18;
    uint256 public constant MIN_MULTIPLIER = 0.5e18; // 0.5x
    uint256 public constant MAX_MULTIPLIER = 2.5e18; // 2.5x

    uint256 public currentEpoch;
    uint256 public lastEpochTimestamp;
    uint256 public epochDuration;
    SpecTypes.PolicyRegime public currentRegime;
    uint256 public policyMultiplier = 1e18; // Default 1.0x

    event EpochAdvanced(uint256 indexed epoch, SpecTypes.PolicyRegime regime, uint256 policyMultiplier);
    event RegimeChanged(SpecTypes.PolicyRegime newRegime);

    error EpochNotElapsed(uint256 timeRemaining);

    constructor(uint256 _epochDuration) {
        epochDuration = _epochDuration;
        lastEpochTimestamp = block.timestamp;
        currentRegime = SpecTypes.PolicyRegime.Expansion;
    }

    /**
     * @notice Advances protocol epoch and adjusts monetary regime based on net ETH flow.
     * @dev Enforces SR-POLICY-001, SR-POLICY-002, SR-POLICY-003, INV-POLICY-001.
     */
    function advanceEpoch(int256 netEthFlow) external {
        if (block.timestamp < lastEpochTimestamp + epochDuration) {
            revert EpochNotElapsed((lastEpochTimestamp + epochDuration) - block.timestamp);
        }

        currentEpoch += 1;
        lastEpochTimestamp = block.timestamp;

        if (netEthFlow >= 0) {
            currentRegime = SpecTypes.PolicyRegime.Expansion;
            // Bound multiplier to [1.0x, 2.5x] in expansion
            policyMultiplier = 1e18 + (uint256(netEthFlow) > 1e18 ? 0.5e18 : (uint256(netEthFlow) / 2));
            if (policyMultiplier > MAX_MULTIPLIER) policyMultiplier = MAX_MULTIPLIER;
        } else {
            currentRegime = SpecTypes.PolicyRegime.Contraction;
            // Bound multiplier to [0.5x, 1.0x] in contraction
            uint256 absFlow = uint256(-netEthFlow);
            if (absFlow > 0.5e18) {
                policyMultiplier = MIN_MULTIPLIER;
            } else {
                policyMultiplier = 1e18 - absFlow;
            }
            if (policyMultiplier < MIN_MULTIPLIER) policyMultiplier = MIN_MULTIPLIER;
        }

        emit EpochAdvanced(currentEpoch, currentRegime, policyMultiplier);
    }
}
