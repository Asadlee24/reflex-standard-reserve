// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {StandardSpec} from "../../src/spec/StandardSpec.sol";
import {CharterSpec} from "../../src/spec/CharterSpec.sol";
import {BranchSpec} from "../../src/spec/BranchSpec.sol";
import {ResolutionSpec} from "../../src/spec/ResolutionSpec.sol";
import {PolicySpec} from "../../src/spec/PolicySpec.sol";
import {AuctionSpec} from "../../src/spec/AuctionSpec.sol";
import {VaultSpec} from "../../src/spec/VaultSpec.sol";
import {SpecTypes} from "../../src/spec/SpecTypes.sol";

/**
 * @title SpecHelper
 * @notice Test fixture and deployment helper for SpecLab Foundry suite.
 * @author Asad Lee (https://github.com/Asadlee24)
 */
contract SpecHelper {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18; // 100M $STANDARD
    uint256 public constant GENESIS_SUPPLY = 10_000_000 * 1e18; // 10M $STANDARD

    StandardSpec public standardToken;
    CharterSpec public charterContract;
    BranchSpec public branchContract;
    ResolutionSpec public resolutionContract;
    PolicySpec public policyContract;
    AuctionSpec public auctionContract;
    VaultSpec public vaultContract;

    address public deployer = address(0xAA11);
    address public banker1 = address(0xB1);
    address public banker2 = address(0xB2);

    function setUpFixture() internal {
        standardToken = new StandardSpec(MAX_SUPPLY, GENESIS_SUPPLY, deployer);
        charterContract = new CharterSpec();
        branchContract = new BranchSpec(address(charterContract), address(standardToken));
        resolutionContract = new ResolutionSpec(address(standardToken), 0.02e18, 0.40e18, 0.50e18);
        policyContract = new PolicySpec(86400);
        auctionContract = new AuctionSpec(address(standardToken), address(charterContract));
        vaultContract = new VaultSpec();
    }
}
