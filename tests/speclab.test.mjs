import test from 'node:test';
import assert from 'node:assert/strict';

// SpecLab Reference State Machine & Invariant Tests in JavaScript for direct Node runner validation
class StandardReferenceSpec {
  constructor(maxSupply = 100_000_000, genesisSupply = 10_000_000) {
    this.maxSupply = maxSupply;
    this.circulatingSupply = genesisSupply;
    this.totalUnmintedAccrual = 0;
    this.totalBurned = 0;
    this.remainingIssuanceBudget = maxSupply - genesisSupply;
    this.charters = new Map();
    this.branches = new Map();
    this.nextCharterId = 1;
    this.nextBranchId = 1;
  }

  createCharter(owner, maxBranches = 5) {
    const id = this.nextCharterId++;
    this.charters.set(id, { id, owner, status: 'Active', maxBranches, activeBranches: 0 });
    return id;
  }

  openBranch(charterId) {
    const charter = this.charters.get(charterId);
    if (!charter || charter.status !== 'Active') throw new Error('Invalid charter');
    if (charter.activeBranches >= charter.maxBranches) throw new Error('Branch capacity exceeded');
    charter.activeBranches += 1;
    const branchId = this.nextBranchId++;
    this.branches.set(branchId, { id: branchId, charterId, status: 'Active', accrued: 0, realized: 0 });
    return branchId;
  }

  accrueIssuance(branchId, amount) {
    const branch = this.branches.get(branchId);
    if (!branch || branch.status !== 'Active') throw new Error('Invalid branch');
    if (amount > this.remainingIssuanceBudget) throw new Error('Budget exceeded');
    this.remainingIssuanceBudget -= amount;
    this.totalUnmintedAccrual += amount;
    branch.accrued += amount;
  }

  resolveBranch(branchId) {
    const branch = this.branches.get(branchId);
    if (!branch) throw new Error('Branch not found');
    if (branch.status === 'Resolved') throw new Error('Branch already resolved');
    if (branch.status !== 'Active') throw new Error('Branch not active');

    branch.status = 'Resolved';
    const charter = this.charters.get(branch.charterId);
    charter.activeBranches -= 1;
    if (charter.activeBranches === 0) charter.status = 'Dormant';

    const realized = branch.accrued;
    this.totalUnmintedAccrual -= realized;
    this.circulatingSupply += realized;
    branch.realized += realized;
    branch.accrued = 0;
    return realized;
  }

  burn(amount) {
    if (amount > this.circulatingSupply) throw new Error('Insufficient balance');
    this.circulatingSupply -= amount;
    this.totalBurned += amount;
  }

  verifyAccountingEquation() {
    return (this.circulatingSupply + this.totalBurned + this.totalUnmintedAccrual + this.remainingIssuanceBudget) === this.maxSupply;
  }
}

test('INV-SUPPLY-001: supply hard cap cannot be exceeded under accrual or minting', () => {
  const spec = new StandardReferenceSpec(100, 10);
  const cId = spec.createCharter('0xAlice', 3);
  const bId = spec.openBranch(cId);

  spec.accrueIssuance(bId, 90);
  assert.equal(spec.totalUnmintedAccrual, 90);
  assert.equal(spec.remainingIssuanceBudget, 0);

  // Attempting further accrual must throw
  assert.throws(() => spec.accrueIssuance(bId, 1), /Budget exceeded/);

  // Resolving branch mints accrual into circulating supply
  spec.resolveBranch(bId);
  assert.equal(spec.circulatingSupply, 100);
  assert.equal(spec.totalUnmintedAccrual, 0);
  assert.ok(spec.circulatingSupply <= spec.maxSupply);
});

test('INV-BRANCH-001: active branches cannot exceed charter capacity', () => {
  const spec = new StandardReferenceSpec(100, 10);
  const cId = spec.createCharter('0xAlice', 2);
  spec.openBranch(cId);
  spec.openBranch(cId);
  assert.throws(() => spec.openBranch(cId), /Branch capacity exceeded/);
});

test('INV-BRANCH-003: a branch cannot be resolved twice', () => {
  const spec = new StandardReferenceSpec(100, 10);
  const cId = spec.createCharter('0xAlice', 2);
  const bId = spec.openBranch(cId);
  spec.resolveBranch(bId);
  assert.throws(() => spec.resolveBranch(bId), /Branch already resolved/);
});

test('INV-ACCOUNTING-001: accounting conservation holds across complex action sequences', () => {
  const spec = new StandardReferenceSpec(10_000_000, 1_000_000);
  const c1 = spec.createCharter('0xAlice', 5);
  const c2 = spec.createCharter('0xBob', 5);

  const b1 = spec.openBranch(c1);
  const b2 = spec.openBranch(c1);
  const b3 = spec.openBranch(c2);

  spec.accrueIssuance(b1, 500_000);
  spec.accrueIssuance(b2, 300_000);
  spec.accrueIssuance(b3, 200_000);

  assert.ok(spec.verifyAccountingEquation());

  spec.resolveBranch(b1);
  assert.ok(spec.verifyAccountingEquation());

  spec.burn(200_000);
  assert.ok(spec.verifyAccountingEquation());

  spec.resolveBranch(b2);
  spec.resolveBranch(b3);
  assert.ok(spec.verifyAccountingEquation());
});
