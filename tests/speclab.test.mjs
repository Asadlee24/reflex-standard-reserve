import test from 'node:test';
import assert from 'node:assert/strict';
import { LiveSpecEngine } from '../lib/spec-engine.js';

test('published supply defaults and first branch are present at Charter creation', () => {
  const s = new LiveSpecEngine();
  assert.equal(s.maxSupply, 1_000_000_000);
  assert.equal(s.circulatingSupply, 100_000_000);
  assert.equal(s.remainingIssuanceBudget, 900_000_000);
  const c = s.createCharter('Alice');
  assert.equal(c.activeBranches, 1);
  assert.equal(s.branches[0].charterId, c.id);
  assert.ok(Object.values(s.evaluateInvariants()).every(v => v === 'PASS'));
});
test('budget cannot be exceeded and burns do not replenish issuance', () => {
  const s = new LiveSpecEngine(100, 10);
  s.createCharter('Alice');
  s.accrueIssuance(1, 90);
  assert.throws(() => s.accrueIssuance(1, 1), /budget exceeded/i);
  s.resolveBranch(1);
  assert.equal(s.circulatingSupply, 100);
  s.burnTokens(20);
  s.createCharter('Bob');
  assert.throws(() => s.accrueIssuance(2, 1), /budget exceeded/i);
  assert.equal(s.evaluateInvariants()['INV-ACCOUNTING-001'], 'PASS');
});
test('partial retirement consumes capacity; last exit burns permanently', () => {
  const s = new LiveSpecEngine();
  const c = s.createCharter('Alice');
  s.expandCapacity(c.id);
  s.openBranch(c.id);
  s.accrueIssuance(1, 100);
  s.accrueIssuance(2, 200);
  assert.equal(s.resolveBranch(1), 100);
  assert.equal(c.status, 'Active');
  assert.equal(c.maxBranches, 1);
  assert.throws(() => s.openBranch(c.id), /capacity/);
  assert.equal(s.resolveBranch(2), 200);
  assert.equal(c.status, 'Burned');
  assert.throws(() => s.openBranch(c.id), /Inactive/);
  assert.throws(() => s.expandCapacity(c.id), /Inactive/);
  assert.throws(() => s.resolveBranch(2), /already resolved/);
  assert.throws(() => s.accrueIssuance(2, 1), /not active/);
  assert.ok(Object.values(s.evaluateInvariants()).every(v => v === 'PASS'));
});
test('a Charter cannot exceed ten branches', () => {
  const s = new LiveSpecEngine();
  const c = s.createCharter('Alice');
  s.expandCapacity(c.id, 9);
  for (let i = 1; i < 10; i++) s.openBranch(c.id);
  assert.throws(() => s.openBranch(c.id), /capacity/);
  assert.throws(() => s.expandCapacity(c.id), /exceeds 10/);
  assert.equal(c.activeBranches, 10);
});
test('invalid numeric inputs cannot mutate accounting', () => {
  const s = new LiveSpecEngine(100, 10);
  s.createCharter('Alice');
  const before = JSON.stringify(s.getStateSnapshot());
  for (const value of [-1, NaN, Infinity, 0.1, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => s.accrueIssuance(1, value));
    assert.throws(() => s.burnTokens(value));
    assert.throws(() => s.expandCapacity(1, value));
  }
  assert.equal(JSON.stringify(s.getStateSnapshot()), before);
  assert.throws(() => new LiveSpecEngine(10, 11), /Genesis/);
  assert.throws(() => new LiveSpecEngine(-1, 0));
});
test('zero net flow is contraction and reset restores a clean model', () => {
  const s = new LiveSpecEngine();
  s.advanceEpoch(1);
  assert.equal(s.policyRegime, 'Expansion');
  s.advanceEpoch(0);
  assert.equal(s.policyRegime, 'Contraction');
  s.advanceEpoch(-1);
  assert.equal(s.policyRegime, 'Contraction');
  assert.throws(() => s.advanceEpoch(NaN), /finite/);
  s.createCharter('Alice');
  s.reset();
  assert.equal(s.charters.length, 0);
  assert.equal(s.branches.length, 0);
  assert.equal(s.remainingIssuanceBudget, 900_000_000);
});
