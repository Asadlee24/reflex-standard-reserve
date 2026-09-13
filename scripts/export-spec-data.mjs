import fs from 'node:fs';
import path from 'node:path';

const GENERATED_DIR = path.resolve('generated');
const TRACES_DIR = path.join(GENERATED_DIR, 'traces');

if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });
if (!fs.existsSync(TRACES_DIR)) fs.mkdirSync(TRACES_DIR, { recursive: true });

// 1. Spec Rules
const specRules = [
  {
    id: "SR-SUPPLY-001",
    domain: "SUPPLY",
    title: "Hard Supply Cap",
    summary: "Total $STANDARD in existence plus unminted issuance cannot exceed the protocol hard cap.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §1.1",
    model: "StandardSpec.sol",
    affectedInvariants: ["INV-SUPPLY-001", "INV-ACCOUNTING-001"],
    status: "MODELED"
  },
  {
    id: "SR-SUPPLY-002",
    domain: "SUPPLY",
    title: "Genesis Allocation",
    summary: "100 million STANDARD is preminted as protocol-owned liquidity; the hard cap is 1 billion.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §1.2",
    model: "StandardSpec.sol",
    affectedInvariants: ["INV-ACCOUNTING-001"],
    status: "MODELED"
  },
  {
    id: "SR-SUPPLY-003",
    domain: "SUPPLY",
    title: "Issuance Budget Constraints",
    summary: "Future token creation occurs strictly through Banker accrual and policy-directed mechanisms.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §2.3",
    model: "StandardSpec.sol",
    affectedInvariants: ["INV-SUPPLY-002"],
    status: "MODELED"
  },
  {
    id: "SR-SUPPLY-004",
    domain: "SUPPLY",
    title: "Token Burn Permanence",
    summary: "Tokens burned via Resolution Fees or Expansion Licences reduce total supply permanently.",
    classification: "DERIVED",
    source: "Official Whitepaper v1 §4.1",
    model: "StandardSpec.sol",
    affectedInvariants: ["INV-SUPPLY-003", "INV-ACCOUNTING-001"],
    status: "MODELED"
  },
  {
    id: "SR-POLICY-001",
    domain: "POLICY",
    title: "Dual Monetary Regimes",
    summary: "Protocol operates in either Expansion Regime (net positive liquidity demand) or Contraction Regime.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §3.1",
    model: "PolicySpec.sol",
    affectedInvariants: ["INV-POLICY-001"],
    status: "MODELED"
  },
  {
    id: "SR-POLICY-002",
    domain: "POLICY",
    title: "Policy Multiplier Bounds",
    summary: "Expansion rate and contraction multipliers are bounded within strict mathematical envelopes.",
    classification: "DERIVED",
    source: "Whitepaper v1 & Founder Disclosures",
    model: "PolicySpec.sol",
    affectedInvariants: ["INV-POLICY-001"],
    status: "MODELED"
  },
  {
    id: "SR-CHARTER-001",
    domain: "CHARTERS",
    title: "Founding Charters",
    summary: "Genesis Bankers receive Founding Charters authorizing initial Branch deployment and operational capacity.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §2.1",
    model: "CharterSpec.sol",
    affectedInvariants: ["INV-CHARTER-001"],
    status: "MODELED"
  },
  {
    id: "SR-CHARTER-002",
    domain: "CHARTERS",
    title: "Charter Lifecycle Transitions",
    summary: "Retiring the last branch burns the Charter permanently. Re-entry requires a new Charter.",
    classification: "DERIVED",
    source: "Official Whitepaper v1 §2.4",
    model: "CharterSpec.sol",
    affectedInvariants: ["INV-CHARTER-001", "INV-CHARTER-002"],
    status: "MODELED"
  },
  {
    id: "SR-BRANCH-001",
    domain: "BRANCHES",
    title: "Branch Activation",
    summary: "Charters deploy Branches to manage operational capital and accrue protocol issuance.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §2.5",
    model: "BranchSpec.sol",
    affectedInvariants: ["INV-BRANCH-001"],
    status: "MODELED"
  },
  {
    id: "SR-BRANCH-002",
    domain: "BRANCHES",
    title: "Maximum Branch Limit",
    summary: "An active Charter cannot exceed a protocol-enforced maximum number of active Branches.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §2.6",
    model: "BranchSpec.sol",
    affectedInvariants: ["INV-BRANCH-001"],
    status: "MODELED"
  },
  {
    id: "SR-BRANCH-003",
    domain: "BRANCHES",
    title: "Branch Resolution",
    summary: "Bankers can voluntarily retire/resolve a Branch to realize accrued capital and exit.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §4.2",
    model: "BranchSpec.sol",
    affectedInvariants: ["INV-BRANCH-002", "INV-BRANCH-003"],
    status: "MODELED"
  },
  {
    id: "SR-BRANCH-004",
    domain: "BRANCHES",
    title: "Resolution Singularity",
    summary: "A Branch cannot be resolved more than once (terminal state).",
    classification: "DERIVED",
    source: "State Machine Invariant",
    model: "BranchSpec.sol",
    affectedInvariants: ["INV-BRANCH-003"],
    status: "MODELED"
  },
  {
    id: "SR-ISSUANCE-001",
    domain: "ISSUANCE",
    title: "Unminted Accrual Accounting",
    summary: "Issuance accrues internally as unminted ledger credits until explicitly realized or resolved.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §2.3",
    model: "StandardSpec.sol",
    affectedInvariants: ["INV-ISSUANCE-001"],
    status: "MODELED"
  },
  {
    id: "SR-ISSUANCE-002",
    domain: "ISSUANCE",
    title: "Withdrawal Realization Bounds",
    summary: "A Banker cannot withdraw more $STANDARD than their verified accrued balance.",
    classification: "DERIVED",
    source: "Accounting Invariants",
    model: "BranchSpec.sol",
    affectedInvariants: ["INV-ISSUANCE-002"],
    status: "MODELED"
  },
  {
    id: "SR-RESOLUTION-001",
    domain: "RESOLUTION",
    title: "Trailing Exit Pressure",
    summary: "Exit pressure is calculated as trailing withdrawals over total held capital.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §4.4",
    model: "ResolutionSpec.sol",
    affectedInvariants: ["INV-RESOLUTION-001"],
    status: "MODELED"
  },
  {
    id: "SR-RESOLUTION-002",
    domain: "RESOLUTION",
    title: "Quadratic Resolution Fee Curve",
    summary: "Exit fee scales quadratically with exit pressure between a floor and ceiling.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §4.5",
    model: "ResolutionSpec.sol",
    affectedInvariants: ["INV-RESOLUTION-001"],
    status: "MODELED"
  },
  {
    id: "SR-RESOLUTION-003",
    domain: "RESOLUTION",
    title: "Resolution Fee 50/50 Burn/Redistribution",
    summary: "50% of gross resolution fee is burned; 50% is redistributed to remaining active Bankers.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §4.6",
    model: "ResolutionSpec.sol",
    affectedInvariants: ["INV-RESOLUTION-002", "INV-RESOLUTION-003"],
    status: "MODELED"
  },
  {
    id: "SR-AUCTION-001",
    domain: "AUCTIONS",
    title: "Expansion Licence Auctions",
    summary: "Daily Dutch purchases execute immediately at the current falling price. Licence payments burn STANDARD.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §5.1",
    model: "AuctionSpec.sol",
    affectedInvariants: ["INV-AUCTION-001"],
    status: "MODELED"
  },
  {
    id: "SR-VAULT-001",
    domain: "VAULTS",
    title: "Expansion & Contraction Reserve Vaults",
    summary: "Dedicated reserve vaults hold protocol liquidity and hard reserves.",
    classification: "CONFIRMED",
    source: "Official Whitepaper v1 §6.1",
    model: "VaultSpec.sol",
    affectedInvariants: ["INV-ACCOUNTING-001"],
    status: "MODELED"
  }
];

// 2. Invariants Registry
const invariants = [
  {
    id: "INV-SUPPLY-001",
    name: "Supply Hard Cap Invariant",
    domain: "SUPPLY",
    formalProperty: "circulatingSupply + totalUnmintedAccrual <= MAX_SUPPLY",
    rationale: "Total token obligations cannot exceed the protocol hard ceiling under any sequence of accruals or mints.",
    sourceRule: "SR-SUPPLY-001",
    classification: "CONFIRMED",
    foundryTest: "ProtocolInvariantTest::invariant_SupplyHardCap",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-SUPPLY-002",
    name: "Issuance Budget Non-Negativity",
    domain: "SUPPLY",
    formalProperty: "remainingIssuanceBudget >= 0",
    rationale: "Unallocated issuance budget cannot be overdrawn.",
    sourceRule: "SR-SUPPLY-003",
    classification: "DERIVED",
    foundryTest: "SupplyInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-SUPPLY-003",
    name: "Monotonic Burn Reduction",
    domain: "SUPPLY",
    formalProperty: "forall t2 > t1, burn(x) => circulatingSupply(t2) <= circulatingSupply(t1)",
    rationale: "Token burn operations must strictly reduce or conserve supply.",
    sourceRule: "SR-SUPPLY-004",
    classification: "DERIVED",
    foundryTest: "SupplyInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-BRANCH-001",
    name: "Branch Capacity Limit",
    domain: "BRANCHES",
    formalProperty: "forall c in Charters, activeBranches(c) <= maxBranches(c)",
    rationale: "A Charter cannot deploy more branches than its authorized maximum capacity.",
    sourceRule: "SR-BRANCH-002",
    classification: "CONFIRMED",
    foundryTest: "BranchInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-BRANCH-002",
    name: "Resolved Branch Inactivity",
    domain: "BRANCHES",
    formalProperty: "forall b in Branches, b.status == Resolved => delta accrual(b) == 0",
    rationale: "A resolved branch cannot accrue future issuance.",
    sourceRule: "SR-BRANCH-004",
    classification: "DERIVED",
    foundryTest: "BranchInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-BRANCH-003",
    name: "Single Resolution Invariant",
    domain: "BRANCHES",
    formalProperty: "resolveBranch(b) can execute at most once per branch instance",
    rationale: "Branch resolution is a terminal state transition.",
    sourceRule: "SR-BRANCH-004",
    classification: "DERIVED",
    foundryTest: "BranchInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-CHARTER-001",
    name: "Destroyed Charter Immobility",
    domain: "CHARTERS",
    formalProperty: "c.status == Burned => openBranch(c) reverts",
    rationale: "A destroyed Charter cannot execute any future administrative or operational actions.",
    sourceRule: "SR-CHARTER-002",
    classification: "DERIVED",
    foundryTest: "CharterInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-CHARTER-002",
    name: "Terminal Charter Burn on Last Exit",
    domain: "CHARTERS",
    formalProperty: "previouslyOpened(c) && activeBranches(c) == 0 => c.status == Burned",
    rationale: "A previously opened Charter burns when its last branch is retired.",
    sourceRule: "SR-CHARTER-002",
    classification: "DERIVED",
    foundryTest: "CharterInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-ISSUANCE-001",
    name: "Accrual Ledger Consistency",
    domain: "ISSUANCE",
    formalProperty: "sum(branches.accrued) == totalUnmintedAccrual",
    rationale: "Internal unminted credits must equal the sum of all individual active branch balances.",
    sourceRule: "SR-ISSUANCE-001",
    classification: "CONFIRMED",
    foundryTest: "IssuanceInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-ISSUANCE-002",
    name: "Accrual Realization Bound",
    domain: "ISSUANCE",
    formalProperty: "withdrawn(b) <= accrued(b)",
    rationale: "Withdrawals cannot realize more tokens than accrued.",
    sourceRule: "SR-ISSUANCE-002",
    classification: "DERIVED",
    foundryTest: "IssuanceInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-RESOLUTION-001",
    name: "Resolution Fee Boundedness",
    domain: "RESOLUTION",
    formalProperty: "forall P in [0, 1], feeFloor <= resolutionFee(P) <= feeCeiling",
    rationale: "Resolution fee rate must stay bounded between configured floor and ceiling bounds.",
    sourceRule: "SR-RESOLUTION-002",
    classification: "CONFIRMED",
    foundryTest: "ProtocolInvariantTest::invariant_FeeBounds",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-RESOLUTION-002",
    name: "Fee Split Reconciliation",
    domain: "RESOLUTION",
    formalProperty: "burnedFee + redistributedFee == grossFee",
    rationale: "50/50 fee routing exactly reconciles without loss or surplus.",
    sourceRule: "SR-RESOLUTION-003",
    classification: "CONFIRMED",
    foundryTest: "ResolutionInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-RESOLUTION-003",
    name: "Fee Conservation Non-Inflationary",
    domain: "RESOLUTION",
    formalProperty: "delta circulatingSupply <= 0 during fee distribution",
    rationale: "Fee routing cannot create or inflate token supply.",
    sourceRule: "SR-RESOLUTION-003",
    classification: "DERIVED",
    foundryTest: "ResolutionInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-AUCTION-001",
    name: "Dutch Supply Conservation",
    domain: "AUCTIONS",
    formalProperty: "0 <= sold(a) <= supply(a); a failed purchase does not consume supply",
    rationale: "Each successful purchase consumes one unit at its current price; no final clearing-price repricing.",
    sourceRule: "SR-AUCTION-002",
    classification: "DERIVED",
    foundryTest: "AuctionInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-POLICY-001",
    name: "Policy Multiplier Bounds",
    domain: "POLICY",
    formalProperty: "policyMultiplier in [MIN_MULTIPLIER, MAX_MULTIPLIER]",
    rationale: "Monetary policy output stays strictly within predefined mathematical safety bounds.",
    sourceRule: "SR-POLICY-002",
    classification: "DERIVED",
    foundryTest: "PolicyInvariant.t.sol",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  },
  {
    id: "INV-ACCOUNTING-001",
    name: "Global Accounting Conservation Equation",
    domain: "ACCOUNTING",
    formalProperty: "circulatingSupply + totalBurned + totalUnmintedAccrual + remainingIssuanceBudget == MAX_SUPPLY",
    rationale: "Total token state space is strictly conserved across all mint, burn, accrual, and resolution actions.",
    sourceRule: "SR-SUPPLY-001",
    classification: "DERIVED",
    foundryTest: "ProtocolInvariantTest::invariant_AccountingConservation",
    status: "UNVERIFIED",
    runs: null,
    depth: null,
    commit: null
  }
];

// 3. Assumptions
const assumptions = [
  {
    id: "ASM-001",
    name: "Pressure Denominator Guard",
    classification: "REFLEX ASSUMPTION",
    assumedValue: "1e-12 (epsilon)",
    primaryStatus: "REDACTED",
    risk: "Minor numerical smoothing distortion near empty liquidity pool",
    affectedModules: ["ResolutionSpec", "REFLEX Dynamics"]
  },
  {
    id: "ASM-002",
    name: "Fee Floor (F_min)",
    classification: "REFLEX ASSUMPTION",
    assumedValue: "2.0% (0.02)",
    primaryStatus: "REDACTED",
    risk: "Shifts baseline exit friction",
    affectedModules: ["ResolutionSpec", "INV-RESOLUTION-001"]
  },
  {
    id: "ASM-003",
    name: "Fee Ceiling (F_max)",
    classification: "REFLEX ASSUMPTION",
    assumedValue: "40.0% (0.40)",
    primaryStatus: "REDACTED",
    risk: "Alters peak deterrence in cascade regimes",
    affectedModules: ["ResolutionSpec", "INV-RESOLUTION-001"]
  },
  {
    id: "ASM-004",
    name: "Fee Saturation Pressure (S)",
    classification: "REFLEX ASSUMPTION",
    assumedValue: "50.0% (0.50)",
    primaryStatus: "REDACTED",
    risk: "Changes steepness of quadratic fee curve",
    affectedModules: ["ResolutionSpec", "REFLEX Dynamics"]
  },
  {
    id: "ASM-005",
    name: "Trailing Pressure Window",
    classification: "SECONDARY_ONLY",
    assumedValue: "7 Days / Epochs",
    primaryStatus: "SECONDARY_ONLY (Central Bank Bot)",
    risk: "Changes memory window of exit impact",
    affectedModules: ["ResolutionSpec", "REFLEX Dynamics"]
  },
  {
    id: "ASM-006",
    name: "Participant Exit Sensitivity Function",
    classification: "REFLEX ASSUMPTION",
    assumedValue: "Logistic / Sigmoid",
    primaryStatus: "REFLEX ORIGINAL",
    risk: "Behavioral model assumption only — not a protocol invariant",
    affectedModules: ["REFLEX Dynamics"]
  }
];

specRules.push({
  id: 'SR-AUCTION-002', domain: 'AUCTIONS', title: 'Dutch Purchase Supply',
  summary: 'A successful purchase consumes one unit; failures preserve supply and earlier receipts are not repriced.',
  classification: 'DERIVED', source: 'Whitepaper v0.1 §8', model: 'AuctionSpec.sol',
  affectedInvariants: ['INV-AUCTION-001'], status: 'MODELED'
});

// This exporter writes authored reference data. It does not execute tests.
const mappedTests = {
  'INV-SUPPLY-001': 'invariant_SupplyHardCap',
  'INV-ACCOUNTING-001': 'invariant_AccountingConservation',
  'INV-RESOLUTION-001': 'invariant_FeeBounds',
  'INV-CHARTER-002': 'invariant_CharterLifecycle'
};
for (const invariant of invariants) {
  invariant.previousClassification = invariant.classification;
  invariant.classification = 'NEEDS_REVIEW';
  invariant.proposedFoundryTest = invariant.foundryTest;
  invariant.foundryTest = mappedTests[invariant.id]
    ? `test/invariant/ProtocolInvariant.t.sol::${mappedTests[invariant.id]}`
    : null;
  invariant.testCommand = mappedTests[invariant.id]
    ? `forge test --match-path test/invariant/ProtocolInvariant.t.sol --match-test ${mappedTests[invariant.id]} -vvv`
    : null;
}
// These historical rule mappings have not been reconciled with the launch design.
for (const rule of specRules) {
  rule.previousClassification = rule.classification;
  rule.classification = 'NEEDS_REVIEW';
  rule.reviewNote = 'Legacy model mapping. See research/LAUNCH_REVIEW.md for known differences.';
}
const reviewedRules = {
  'SR-SUPPLY-002': ['§3 The currency', 'Published 1B cap / 100M genesis; fixtures can use other sizes.'],
  'SR-CHARTER-002': ['§6 Charters; §9 Earning and withdrawing', 'Terminal last-branch burn is modeled.'],
  'SR-AUCTION-002': ['§8 How the auctions work', 'Derived current-price purchase and supply accounting; tested in the independent Solidity fixture.'],
  'SR-AUCTION-001': ['§7 Branches and expansion licenses; §8 How the auctions work', 'Dutch purchase semantics are modeled with a discrete fixture schedule, not the official exponential curve.']
};
for (const rule of specRules) {
  if (reviewedRules[rule.id]) {
    rule.classification = 'PUBLISHED_DESIGN';
    rule.source = `https://www.standardreserve.xyz/whitepaper/ — v0.1 ${reviewedRules[rule.id][0]}`;
    rule.reviewNote = reviewedRules[rule.id][1];
  }
}
const testResults = {
  kind: 'UNVERIFIED_REFERENCE_DATA',
  scope: 'Independent REFLEX model only',
  timestamp: null,
  commitSha: null,
  solidityVersion: null,
  nodeVersion: null,
  totalInvariants: invariants.length,
  passingInvariants: null,
  unverifiedInvariants: invariants.length,
  candidateInvariants: 0,
  blockedInvariants: 0,
  fuzzRuns: null,
  maxSequenceDepth: null,
  suiteDurationMs: null,
  status: 'NOT_RUN',
  note: 'Exporting authored data does not run Node or Foundry tests. No execution record is attached.'
};

// 5. Sample Forensic Traces
const sampleTrace01 = {
  traceId: "TRACE-001",
  name: "Nominal Charter Lifecycle & Branch Resolution Sequence",
  timestamp: "2026-09-01T14:30:00Z",
  seed: "0x5354414e444152445f3031",
  verdict: "ILLUSTRATIVE",
  failureClassification: null,
  stepsCount: 6,
  steps: [
    {
      stepIndex: 0,
      action: "genesisInitialize(100M, 10M)",
      caller: "0xDeployer",
      preState: { circulating: "0", unminted: "0", remainingBudget: "100M", activeBranches: 0 },
      postState: { circulating: "10M", unminted: "0", remainingBudget: "90M", activeBranches: 0 },
      invariantsChecked: ["INV-SUPPLY-001", "INV-ACCOUNTING-001"],
      status: "UNVERIFIED"
    },
    {
      stepIndex: 1,
      action: "createCharter(owner: 0xAlice, maxBranches: 3)",
      caller: "0xDeployer",
      preState: { activeCharters: 0, activeBranches: 0 },
      postState: { activeCharters: 1, activeBranches: 0, charterStatus: "Active" },
      invariantsChecked: ["INV-CHARTER-001"],
      status: "UNVERIFIED"
    },
    {
      stepIndex: 2,
      action: "openBranch(charterId: 1)",
      caller: "0xAlice",
      preState: { activeBranches: 0, charterBranches: 0 },
      postState: { activeBranches: 1, charterBranches: 1, branchStatus: "Active" },
      invariantsChecked: ["INV-BRANCH-001"],
      status: "UNVERIFIED"
    },
    {
      stepIndex: 3,
      action: "accrueIssuance(branchId: 1, amount: 500,000)",
      caller: "0xPolicyEngine",
      preState: { unminted: "0", remainingBudget: "90M", branchAccrual: "0" },
      postState: { unminted: "500K", remainingBudget: "89.5M", branchAccrual: "500K" },
      invariantsChecked: ["INV-ISSUANCE-001", "INV-ACCOUNTING-001"],
      status: "UNVERIFIED"
    },
    {
      stepIndex: 4,
      action: "resolveBranch(branchId: 1)",
      caller: "0xAlice",
      preState: { activeBranches: 1, unminted: "500K", circulating: "10M" },
      postState: { activeBranches: 0, unminted: "0", circulating: "10.5M", charterStatus: "Burned" },
      invariantsChecked: ["INV-BRANCH-002", "INV-BRANCH-003", "INV-CHARTER-002", "INV-ACCOUNTING-001"],
      status: "UNVERIFIED"
    },
    {
      stepIndex: 5,
      action: "verifyFinalConservation()",
      caller: "0xSpecHarness",
      preState: { circulating: "10.5M", unminted: "0", remainingBudget: "89.5M", burned: "0" },
      postState: { circulating: "10.5M", unminted: "0", remainingBudget: "89.5M", burned: "0" },
      invariantsChecked: ["INV-SUPPLY-001", "INV-ACCOUNTING-001"],
      status: "UNVERIFIED"
    }
  ]
};

const sampleTrace02 = {
  traceId: "TRACE-002",
  name: "Illustrative Branch Capacity Sequence",
  timestamp: "2026-09-01T14:35:00Z",
  seed: "0x5354414e444152445f3032",
  verdict: "ILLUSTRATIVE",
  failureClassification: null,
  stepsCount: 5,
  steps: [
    {
      stepIndex: 0,
      action: "createCharter(owner: 0xBob, maxBranches: 2)",
      caller: "0xDeployer",
      preState: { activeBranches: 0 },
      postState: { maxCapacity: 2, activeBranches: 0 },
      invariantsChecked: ["INV-CHARTER-001"],
      status: "UNVERIFIED"
    },
    {
      stepIndex: 1,
      action: "openBranch(charter: 2) -> branchId: 2",
      caller: "0xBob",
      preState: { activeBranches: 0 },
      postState: { activeBranches: 1 },
      invariantsChecked: ["INV-BRANCH-001"],
      status: "UNVERIFIED"
    },
    {
      stepIndex: 2,
      action: "openBranch(charter: 2) -> branchId: 3",
      caller: "0xBob",
      preState: { activeBranches: 1 },
      postState: { activeBranches: 2 },
      invariantsChecked: ["INV-BRANCH-001"],
      status: "UNVERIFIED"
    },
    {
      stepIndex: 3,
      action: "openBranch(charter: 2) [REVERT EXPECTED]",
      caller: "0xBob",
      preState: { activeBranches: 2, maxCapacity: 2 },
      postState: { activeBranches: 2, reverted: true, reason: "Branch capacity exceeded" },
      invariantsChecked: ["INV-BRANCH-001"],
      status: "UNVERIFIED"
    },
    {
      stepIndex: 4,
      action: "expandCapacity(charter: 2, +2 via Licence)",
      caller: "0xAuctionEngine",
      preState: { maxCapacity: 2 },
      postState: { maxCapacity: 4 },
      invariantsChecked: ["INV-BRANCH-001"],
      status: "UNVERIFIED"
    }
  ]
};

// Authored traces are teaching examples, not captured execution records.
for (const trace of [sampleTrace01, sampleTrace02]) {
  trace.kind = 'AUTHORED_EXAMPLE';
  trace.note = 'Illustrative low-level fixture transitions. Setup uses custom capacity and supply and omits fees. No tests were executed to produce this trace.';
  trace.timestamp = null;
  trace.seed = null;
  for (const step of trace.steps) step.status = 'NOT_EVALUATED';
}

// Write files
fs.writeFileSync(path.join(GENERATED_DIR, 'spec-rules.json'), JSON.stringify(specRules, null, 2));
fs.writeFileSync(path.join(GENERATED_DIR, 'invariants.json'), JSON.stringify(invariants, null, 2));
fs.writeFileSync(path.join(GENERATED_DIR, 'assumptions.json'), JSON.stringify(assumptions, null, 2));
fs.writeFileSync(path.join(GENERATED_DIR, 'test-results.json'), JSON.stringify(testResults, null, 2));
fs.writeFileSync(path.join(TRACES_DIR, 'trace-001.json'), JSON.stringify(sampleTrace01, null, 2));
fs.writeFileSync(path.join(TRACES_DIR, 'trace-002.json'), JSON.stringify(sampleTrace02, null, 2));

console.log("Successfully generated SpecLab JSON artifacts in ./generated/");
