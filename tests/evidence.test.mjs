import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadSpecLabData } from '../lib/speclab-data.js';
import { renderProvenanceChain } from '../lib/provenance.js';

const exporter = fileURLToPath(new URL('../scripts/export-spec-data.mjs', import.meta.url));

test('an authored export never fabricates execution evidence or references nonexistent test functions', () => {
  const dir = mkdtempSync(join(tmpdir(), 'reflex-evidence-'));
  try {
    execFileSync(process.execPath, [exporter], { cwd: dir });
    const read = name => JSON.parse(readFileSync(join(dir, 'generated', name), 'utf8'));
    const result = read('test-results.json');
    assert.equal(result.status, 'NOT_RUN');
    for (const key of ['timestamp', 'commitSha', 'passingInvariants', 'fuzzRuns', 'maxSequenceDepth', 'suiteDurationMs']) {
      assert.equal(result[key], null, key);
    }
    const invariants = read('invariants.json');
    const ruleIds = new Set(read('spec-rules.json').map(rule => rule.id));
    assert.ok(invariants.every(invariant => ruleIds.has(invariant.sourceRule)), 'Every candidate links to a source rule');
    assert.ok(invariants.length > 0);
    assert.ok(invariants.every(i => i.status === 'UNVERIFIED' && i.runs === null && i.depth === null));
    const harness = readFileSync(new URL('../test/invariant/ProtocolInvariant.t.sol', import.meta.url), 'utf8');
    for (const invariant of invariants) {
      if (invariant.testCommand) {
        const name = invariant.foundryTest.split('::')[1];
        assert.ok(harness.includes(`function ${name}(`));
        assert.ok(invariant.testCommand.includes(`--match-test ${name} `));
      } else {
        assert.equal(invariant.foundryTest, null);
      }
    }
    for (const path of ['traces/trace-001.json', 'traces/trace-002.json']) {
      const trace = read(path);
      assert.equal(trace.kind, 'AUTHORED_EXAMPLE');
      assert.equal(trace.verdict, 'ILLUSTRATIVE');
      assert.equal(trace.timestamp, null);
      assert.equal(trace.seed, null);
      assert.ok(trace.steps.every(step => step.status === 'NOT_EVALUATED'));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

for (const failure of ['network', 'http', 'malformed']) {
  test(`a ${failure} failure produces an unavailable state without positive fallback results`, async t => {
    t.mock.method(console, 'warn', () => {});
    t.mock.method(globalThis, 'fetch', async () => {
      if (failure === 'network') throw new Error('offline');
      return { ok: failure !== 'http', json: async () => ({ wrong: 'shape' }) };
    });
    const result = await loadSpecLabData();
    assert.equal(result.testResults.status, 'UNAVAILABLE');
    assert.equal(result.testResults.passingInvariants, null);
    assert.deepEqual(result.invariants, []);
    assert.deepEqual(result.rules, []);
    assert.deepEqual(result.traces, []);
    assert.match(renderProvenanceChain(undefined, result.rules, result.invariants), /unavailable/i);
  });
}
