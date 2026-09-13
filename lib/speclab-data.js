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
    const resources = [
      './generated/spec-rules.json', './generated/invariants.json',
      './generated/assumptions.json', './generated/test-results.json',
      './generated/traces/trace-001.json', './generated/traces/trace-002.json'
    ];
    const [rules, invariants, assumptions, testResults, trace1, trace2] = await Promise.all(
      resources.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`SpecLab resource unavailable: ${url}`);
        return response.json();
      })
    );
    if (![rules, invariants, assumptions].every(Array.isArray) || !testResults ||
        [trace1, trace2].some(trace => !Array.isArray(trace?.steps) || trace.steps.length === 0)) {
      throw new Error('Invalid SpecLab reference data');
    }
    return { rules, invariants, assumptions, testResults, traces: [trace1, trace2] };
  } catch (err) {
    console.warn('SpecLab reference data could not be loaded', err);
    return getEmbeddedSpecLabData();
  }
}

// Keep an explicit empty state. A failed request must never invent evidence.
export function getEmbeddedSpecLabData() {
  return {
    rules: [], invariants: [], assumptions: [], traces: [],
    testResults: {
      status: 'UNAVAILABLE', timestamp: null, commitSha: null,
      totalInvariants: 0, passingInvariants: null,
      fuzzRuns: null, maxSequenceDepth: null, suiteDurationMs: null
    }
  };
}
