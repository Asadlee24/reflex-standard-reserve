// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title VaultSpec
 * @notice Reference specification for Expansion & Contraction Vault solvency conservation.
 * @author Asad Lee (https://github.com/Asadlee24)
 * @dev Corresponds to Source Rules: SR-VAULT-001, SR-VAULT-002.
 */
contract VaultSpec {
    uint256 public expansionReserve;
    uint256 public contractionReserve;
    uint256 public totalEthDeposited;

    event ReserveDeposited(uint256 amount, bool isExpansion);
    event ReserveWithdrawn(uint256 amount, bool isExpansion);

    error InsufficientReserve(uint256 available, uint256 requested);

    function depositReserve(bool isExpansion, uint256 amount) external payable {
        if (isExpansion) {
            expansionReserve += amount;
        } else {
            contractionReserve += amount;
        }
        totalEthDeposited += amount;
        emit ReserveDeposited(amount, isExpansion);
    }

    function releaseReserve(bool isExpansion, address payable recipient, uint256 amount) external {
        if (isExpansion) {
            if (amount > expansionReserve) revert InsufficientReserve(expansionReserve, amount);
            expansionReserve -= amount;
        } else {
            if (amount > contractionReserve) revert InsufficientReserve(contractionReserve, amount);
            contractionReserve -= amount;
        }
        totalEthDeposited -= amount;
        recipient.transfer(amount);
        emit ReserveWithdrawn(amount, isExpansion);
    }

    /**
     * @notice Solvency conservation: reserves cannot be negative.
     * @dev Enforces SR-VAULT-002.
     */
    function verifySolvency() external view returns (bool) {
        return (expansionReserve + contractionReserve) == totalEthDeposited;
    }
}
