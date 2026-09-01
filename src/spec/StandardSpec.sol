// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {SpecTypes} from "./SpecTypes.sol";

/**
 * @title StandardSpec
 * @notice Executable reference specification for $STANDARD tokenomics & supply conservation.
 * @author Asad Lee (https://github.com/Asadlee24)
 * @dev Corresponds to Source Rules: SR-SUPPLY-001, SR-SUPPLY-002, SR-SUPPLY-003, SR-SUPPLY-004.
 */
contract StandardSpec {
    uint256 public immutable MAX_SUPPLY;
    uint256 public circulatingSupply;
    uint256 public totalUnmintedAccrual;
    uint256 public totalBurned;
    uint256 public remainingIssuanceBudget;

    mapping(address => uint256) public balances;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event AccrualRegistered(uint256 amount);
    event AccrualRealized(address indexed to, uint256 amount);

    error ExceedsMaxSupply(uint256 attempted, uint256 max);
    error ExceedsIssuanceBudget(uint256 requested, uint256 remaining);
    error InsufficientBalance(uint256 available, uint256 required);
    error InsufficientAccrual(uint256 available, uint256 required);

    constructor(uint256 _maxSupply, uint256 _genesisSupply, address _genesisRecipient) {
        require(_genesisSupply <= _maxSupply, "Genesis exceeds max supply");
        MAX_SUPPLY = _maxSupply;
        circulatingSupply = _genesisSupply;
        remainingIssuanceBudget = _maxSupply - _genesisSupply;
        if (_genesisSupply > 0 && _genesisRecipient != address(0)) {
            balances[_genesisRecipient] = _genesisSupply;
            emit Minted(_genesisRecipient, _genesisSupply);
        }
    }

    /**
     * @notice Registers unminted token accrual without increasing circulating supply.
     * @dev Enforces SR-ISSUANCE-001 & INV-SUPPLY-002.
     */
    function registerAccrual(uint256 amount) external {
        if (amount > remainingIssuanceBudget) {
            revert ExceedsIssuanceBudget(amount, remainingIssuanceBudget);
        }
        remainingIssuanceBudget -= amount;
        totalUnmintedAccrual += amount;
        emit AccrualRegistered(amount);
    }

    /**
     * @notice Realizes unminted accrual by minting tokens to user wallet.
     * @dev Enforces SR-ISSUANCE-002 & INV-SUPPLY-001.
     */
    function realizeAccrual(address to, uint256 amount) external {
        if (amount > totalUnmintedAccrual) {
            revert InsufficientAccrual(totalUnmintedAccrual, amount);
        }
        if (circulatingSupply + amount > MAX_SUPPLY) {
            revert ExceedsMaxSupply(circulatingSupply + amount, MAX_SUPPLY);
        }
        totalUnmintedAccrual -= amount;
        circulatingSupply += amount;
        balances[to] += amount;
        emit Minted(to, amount);
        emit AccrualRealized(to, amount);
    }

    /**
     * @notice Permanently burns tokens from circulating balance.
     * @dev Enforces SR-SUPPLY-004 & INV-SUPPLY-003.
     */
    function burn(address from, uint256 amount) external {
        if (balances[from] < amount) {
            revert InsufficientBalance(balances[from], amount);
        }
        balances[from] -= amount;
        circulatingSupply -= amount;
        totalBurned += amount;
        emit Burned(from, amount);
    }

    /**
     * @notice Verifies global accounting conservation equation.
     * @dev Enforces INV-ACCOUNTING-001.
     */
    function verifyAccountingInvariant() external view returns (bool) {
        return (circulatingSupply + totalBurned + totalUnmintedAccrual + remainingIssuanceBudget) == MAX_SUPPLY;
    }
}
