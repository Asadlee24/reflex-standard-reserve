// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {SpecTypes} from "./SpecTypes.sol";
import {StandardSpec} from "./StandardSpec.sol";

/**
 * @title ResolutionSpec
 * @notice Reference specification for Exit Pressure, Quadratic Resolution Fee, and 50/50 Fee Split.
 * @author Asad Lee (https://github.com/Asadlee24)
 * @dev Corresponds to Source Rules: SR-RESOLUTION-001, SR-RESOLUTION-002, SR-RESOLUTION-003.
 */
contract ResolutionSpec {
    uint256 public constant SCALE = 1e18;
    StandardSpec public immutable standardToken;

    uint256 public feeFloor; // e.g. 0.02e18 (2%)
    uint256 public feeCeiling; // e.g. 0.40e18 (40%)
    uint256 public feeSaturation; // e.g. 0.50e18 (50%)

    event FeeDistributed(uint256 grossFee, uint256 burned, uint256 redistributed);

    error InvalidFeeBounds();

    constructor(address _standardToken, uint256 _floor, uint256 _ceiling, uint256 _saturation) {
        if (_floor > _ceiling || _ceiling > SCALE || _saturation == 0 || _saturation > SCALE) {
            revert InvalidFeeBounds();
        }
        standardToken = StandardSpec(_standardToken);
        feeFloor = _floor;
        feeCeiling = _ceiling;
        feeSaturation = _saturation;
    }

    /**
     * @notice Computes exit pressure P = W / (D + W) with epsilon guard.
     * @dev Enforces SR-RESOLUTION-001.
     */
    function computeExitPressure(uint256 trailingWithdrawals, uint256 heldValue) public pure returns (uint256) {
        uint256 total = heldValue + trailingWithdrawals;
        if (total == 0) return 0;
        return (trailingWithdrawals * SCALE) / total;
    }

    /**
     * @notice Computes quadratic resolution fee between floor and ceiling.
     * @dev Enforces SR-RESOLUTION-002 & INV-RESOLUTION-001.
     *      Fee(P) = Floor + (Ceiling - Floor) * min(1, P / Saturation)^2
     */
    function computeResolutionFee(uint256 pressure) public view returns (uint256) {
        uint256 normPressure = (pressure * SCALE) / feeSaturation;
        if (normPressure > SCALE) {
            normPressure = SCALE;
        }

        uint256 quadFactor = (normPressure * normPressure) / SCALE;
        uint256 feeDelta = (feeCeiling - feeFloor) * quadFactor / SCALE;
        return feeFloor + feeDelta;
    }

    /**
     * @notice Splits resolution fee into 50% burned and 50% redistributed.
     * @dev Enforces SR-RESOLUTION-003, INV-RESOLUTION-002, INV-RESOLUTION-003.
     */
    function splitFee(uint256 grossAmount, uint256 feeRate) public pure returns (SpecTypes.FeeSplit memory split) {
        if (feeRate > SCALE) feeRate = SCALE;
        uint256 totalFee = (grossAmount * feeRate) / SCALE;
        uint256 burned = totalFee / 2;
        uint256 redistributed = totalFee - burned;

        return SpecTypes.FeeSplit({
            grossFee: totalFee,
            burned: burned,
            redistributed: redistributed
        });
    }
}
