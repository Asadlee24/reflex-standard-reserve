# SpecLab Failure & Sequence Trace Format

**REFLEX SpecLab — Forensic Execution Traces**  
*Curated by Asad Lee (GitHub: [@Asadlee24](https://github.com/Asadlee24))*

This specification defines the standard JSON and execution trace schema used by SpecLab to replay, inspect, and analyze randomized state transitions and invariant evaluations.

---

## Schema Structure

```json
{
  "$schema": "https://reflex.standardreserve.research/schemas/v1/trace.json",
  "traceId": "TRACE-00104",
  "name": "Branch Resolution and Accounting Reconciliation",
  "timestamp": "2026-09-01T12:00:00Z",
  "seed": "0x89ab12cd34ef5678",
  "verdict": "PASS",
  "failureClassification": null,
  "stepsCount": 8,
  "steps": [
    {
      "stepIndex": 0,
      "action": "genesisInitialize",
      "caller": "0xDeployer",
      "args": { "initialSupply": "1000000000000000000000000" },
      "preState": {
        "circulatingSupply": "0",
        "totalUnmintedAccrual": "0",
        "activeBranches": 0,
        "policyRegime": "Expansion"
      },
      "postState": {
        "circulatingSupply": "1000000000000000000000000",
        "totalUnmintedAccrual": "0",
        "activeBranches": 0,
        "policyRegime": "Expansion"
      },
      "invariantsEvaluated": [
        { "id": "INV-SUPPLY-001", "status": "PASS" },
        { "id": "INV-ACCOUNTING-001", "status": "PASS" }
      ],
      "eventLog": "GenesisInitialized(1000000)"
    }
  ]
}
```

---

## Failure Classifications

When an invariant or test evaluates to `FAIL`, SpecLab classifies the failure into one of 6 distinct categories:

1. **`REFERENCE_MODEL_BUG`**: Flaw in the SpecLab reference Solidity/JS code, not the published mechanism.
2. **`ASSUMPTION_FAILURE`**: Failure caused by an erroneous parameter assumption (`ASM-*`).
3. **`AMBIGUOUS_SPEC`**: Primary documentation lacks sufficient precision to determine deterministic outcome.
4. **`CANDIDATE_COUNTEREXAMPLE`**: A valid sequence of actions permitted by the published rules violates an intended protocol invariant.
5. **`HARNESS_ERROR`**: Fuzzing test setup or mock actor generation issue.
6. **`IMPLEMENTATION_DIVERGENCE`**: *(Active only post-launch)* Mismatch between SpecLab reference model and canonical deployed bytecode.
