/**
 * Provenance proof-chain renderer for REFLEX SpecLab:
 * Maps: Source -> Rule -> Spec Model -> Invariant -> Test -> Result.
 * Built by Asad Lee (https://github.com/Asadlee24)
 */

export function renderProvenanceChain(ruleId, specRules, invariants) {
  const rule = specRules.find((r) => r.id === ruleId) || specRules[0];
  if (!rule) return '<p>Reference data unavailable. No verification result is available.</p>';
  const matchedInvariants = invariants.filter((i) => i.sourceRule === rule.id || (rule.affectedInvariants || []).includes(i.id));

  return `
    <div class="provenance-card">
      <div class="prov-header">
        <span class="prov-badge ${rule.classification.toLowerCase()}">${rule.classification}</span>
        <h4>Model Reference: ${rule.id}</h4>
      </div>

      <div class="prov-chain-flow">
        <div class="prov-node">
          <div class="prov-node-type">HISTORICAL SOURCE REFERENCE</div>
          <div class="prov-node-title">${rule.source}</div>
          <div class="prov-node-sub">Source mapping needs review against the launch design</div>
        </div>

        <div class="prov-connector">↓</div>

        <div class="prov-node">
          <div class="prov-node-type">SPECIFICATION RULE</div>
          <div class="prov-node-title">${rule.id}: ${rule.title}</div>
          <div class="prov-node-sub">${rule.summary}</div>
        </div>

        <div class="prov-connector">↓</div>

        <div class="prov-node">
          <div class="prov-node-type">SOLIDITY REFERENCE MODEL</div>
          <div class="prov-node-title"><code>src/spec/${rule.model}</code></div>
          <div class="prov-node-sub">Independent model under review</div>
        </div>

        <div class="prov-connector">↓</div>

        <div class="prov-node highlight">
          <div class="prov-node-type">PROTOCOL INVARIANT</div>
          <div class="prov-node-title">${matchedInvariants.map(i => `<code>${i.id}</code>`).join(', ') || 'No mapped property'}</div>
          <div class="prov-node-sub">${matchedInvariants[0]?.formalProperty || 'No property mapping available'}</div>
        </div>

        <div class="prov-connector">↓</div>

        <div class="prov-node">
          <div class="prov-node-type">FOUNDRY TEST HARNESS</div>
          <div class="prov-node-title">${matchedInvariants[0]?.foundryTest || 'No implemented Foundry mapping'}</div>
          <div class="prov-node-sub">Status: <strong>UNVERIFIED</strong> (no execution record attached)</div>
        </div>
      </div>
    </div>
  `;
}
