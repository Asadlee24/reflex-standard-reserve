/**
 * Data provider for SpecLab: loads and structures rules, invariants, assumptions, and traces.
 * Built by Asad Lee (https://github.com/Asadlee24)
 */

export const SPEC_DOMAINS = [
  { id: 'ALL', label: 'All Domains', count: 19 },
  { id: 'SUPPLY', label: 'Supply & Tokenomics', count: 4 },
  { id: 'POLICY', label: 'Monetary Policy', count: 2 },
  { id: 'CHARTERS', label: 'Charters & Bankers', count: 2 },
  { id: 'BRANCHES', label: 'Branch Lifecycle', count: 4 },
  { id: 'ISSUANCE', label: 'Issuance & Accrual', count: 2 },
  { id: 'RESOLUTION', label: 'Exit & Resolution', count: 3 },
  { id: 'AUCTIONS', label: 'Auctions', count: 1 },
  { id: 'VAULTS', label: 'Reserve Vaults', count: 1 },
];

export async function loadSpecLabData() {
  try {
    const [rulesRes, invariantsRes, assumptionsRes, testResultsRes, trace1Res, trace2Res] = await Promise.all([
      fetch('./generated/spec-rules.json'),
      fetch('./generated/invariants.json'),
      fetch('./generated/assumptions.json'),
      fetch('./generated/test-results.json'),
      fetch('./generated/traces/trace-001.json'),
      fetch('./generated/traces/trace-002.json'),
    ]);

    return {
      rules: await rulesRes.json(),
      invariants: await invariantsRes.json(),
      assumptions: await assumptionsRes.json(),
      testResults: await testResultsRes.json(),
      traces: [await trace1Res.json(), await trace2Res.json()],
    };
  } catch (err) {
    console.warn('Fallback: loading embedded SpecLab data', err);
    return getEmbeddedSpecLabData();
  }
}

export function getEmbeddedSpecLabData() {
  return {
    rules: [
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
        title: "Resolution Fee 50/50 Split",
        summary: "50% of gross resolution fee is burned; 50% is redistributed to remaining active Bankers.",
        classification: "CONFIRMED",
        source: "Official Whitepaper v1 §4.6",
        model: "ResolutionSpec.sol",
        affectedInvariants: ["INV-RESOLUTION-002", "INV-RESOLUTION-003"],
        status: "MODELED"
      }
    ],
    invariants: [
      {
        id: "INV-SUPPLY-001",
        name: "Supply Hard Cap Invariant",
        domain: "SUPPLY",
        formalProperty: "circulatingSupply + totalUnmintedAccrual <= MAX_SUPPLY",
        rationale: "Total token obligations cannot exceed the protocol hard ceiling under any sequence of accruals or mints.",
        sourceRule: "SR-SUPPLY-001",
        classification: "CONFIRMED",
        foundryTest: "ProtocolInvariantTest::invariant_SupplyHardCap",
        status: "PASS",
        runs: 256,
        depth: 32,
        commit: "f426425"
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
        status: "PASS",
        runs: 256,
        depth: 32,
        commit: "f426425"
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
        status: "PASS",
        runs: 256,
        depth: 32,
        commit: "f426425"
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
        status: "PASS",
        runs: 256,
        depth: 32,
        commit: "f426425"
      }
    ],
    assumptions: [],
    testResults: {
      timestamp: new Date().toISOString(),
      commitSha: "f4264256",
      status: "ALL_PASSING",
      totalInvariants: 16,
      passingInvariants: 16,
      fuzzRuns: 256,
      maxSequenceDepth: 32
    },
    traces: []
  };
}
