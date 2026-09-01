/**
 * Live Client-Side SpecLab Reference Engine
 * Provides an interactive state machine sandbox where users can dispatch actions
 * and observe live state vector mutations with real-time invariant evaluation.
 *
 * Built by Asad Lee (https://github.com/Asadlee24)
 */

export class LiveSpecEngine {
  constructor(maxSupply = 100_000_000, genesisSupply = 10_000_000) {
    this.maxSupply = maxSupply;
    this.genesisSupply = genesisSupply;
    this.reset();
  }

  reset() {
    this.circulatingSupply = this.genesisSupply;
    this.totalUnmintedAccrual = 0;
    this.totalBurned = 0;
    this.remainingIssuanceBudget = this.maxSupply - this.genesisSupply;
    this.currentEpoch = 1;
    this.policyRegime = 'Expansion';
    this.charters = [];
    this.branches = [];
    this.actionHistory = [];
    this.nextCharterId = 1;
    this.nextBranchId = 1;

    this.logAction('System Reset', '0xDeployer', { maxSupply: this.maxSupply, genesis: this.genesisSupply }, 'Initialized');
  }

  createCharter(owner = '0xBanker', maxBranches = 3) {
    const id = this.nextCharterId++;
    const charter = {
      id,
      owner: `${owner}_${id}`,
      status: 'Active',
      maxBranches: Number(maxBranches),
      activeBranches: 0,
    };
    this.charters.push(charter);
    this.logAction(`createCharter(${charter.owner}, max: ${maxBranches})`, charter.owner, { charterId: id, maxBranches }, 'Success');
    return charter;
  }

  openBranch(charterId) {
    const charter = this.charters.find((c) => c.id === Number(charterId));
    if (!charter || charter.status !== 'Active') {
      this.logAction(`openBranch(charter: ${charterId})`, '0xCaller', {}, 'REVERT: Invalid or Inactive Charter');
      throw new Error('Invalid or Inactive Charter');
    }
    if (charter.activeBranches >= charter.maxBranches) {
      this.logAction(`openBranch(charter: ${charterId})`, charter.owner, {}, 'REVERT: Exceeds max branch capacity');
      throw new Error('Exceeds max branch capacity');
    }

    charter.activeBranches += 1;
    const branchId = this.nextBranchId++;
    const branch = {
      id: branchId,
      charterId: charter.id,
      status: 'Active',
      accrued: 0,
      realized: 0,
      creationEpoch: this.currentEpoch,
    };
    this.branches.push(branch);
    this.logAction(`openBranch(charter: ${charter.id}) -> Branch #${branchId}`, charter.owner, { branchId, charterId: charter.id }, 'Success');
    return branch;
  }

  accrueIssuance(branchId, amount = 100_000) {
    const branch = this.branches.find((b) => b.id === Number(branchId));
    if (!branch || branch.status !== 'Active') {
      this.logAction(`accrueIssuance(branch: ${branchId})`, '0xPolicy', {}, 'REVERT: Branch not active');
      throw new Error('Branch not active');
    }

    const requested = Number(amount);
    if (requested > this.remainingIssuanceBudget) {
      this.logAction(`accrueIssuance(branch: ${branchId}, ${requested})`, '0xPolicy', {}, 'REVERT: Budget exceeded');
      throw new Error('Issuance budget exceeded');
    }

    this.remainingIssuanceBudget -= requested;
    this.totalUnmintedAccrual += requested;
    branch.accrued += requested;
    this.logAction(`accrueIssuance(branch: ${branchId}, +${requested.toLocaleString()})`, '0xPolicy', { branchId, amount: requested }, 'Success');
  }

  resolveBranch(branchId) {
    const branch = this.branches.find((b) => b.id === Number(branchId));
    if (!branch) {
      this.logAction(`resolveBranch(branch: ${branchId})`, '0xCaller', {}, 'REVERT: Branch not found');
      throw new Error('Branch not found');
    }
    if (branch.status === 'Resolved') {
      this.logAction(`resolveBranch(branch: ${branchId})`, '0xCaller', {}, 'REVERT: Branch already resolved');
      throw new Error('Branch already resolved');
    }

    branch.status = 'Resolved';
    const charter = this.charters.find((c) => c.id === branch.charterId);
    if (charter) {
      charter.activeBranches -= 1;
      if (charter.activeBranches === 0) charter.status = 'Dormant';
    }

    const realized = branch.accrued;
    this.totalUnmintedAccrual -= realized;
    this.circulatingSupply += realized;
    branch.realized += realized;
    branch.accrued = 0;

    this.logAction(`resolveBranch(branch: ${branchId}) [Realized ${realized.toLocaleString()} $STANDARD]`, charter ? charter.owner : '0xBanker', { branchId, realized }, 'Success');
    return realized;
  }

  burnTokens(amount = 50_000) {
    const burnAmt = Number(amount);
    if (burnAmt > this.circulatingSupply) {
      this.logAction(`burn(${burnAmt})`, '0xCaller', {}, 'REVERT: Insufficient balance');
      throw new Error('Insufficient circulating supply to burn');
    }

    this.circulatingSupply -= burnAmt;
    this.totalBurned += burnAmt;
    this.logAction(`burn(${burnAmt.toLocaleString()} $STANDARD)`, '0xSink', { amount: burnAmt }, 'Success');
  }

  advanceEpoch(netFlow = 500) {
    this.currentEpoch += 1;
    this.policyRegime = netFlow >= 0 ? 'Expansion' : 'Contraction';
    this.logAction(`advanceEpoch() -> Epoch ${this.currentEpoch} [${this.policyRegime}]`, '0xTimelock', { epoch: this.currentEpoch, regime: this.policyRegime }, 'Success');
  }

  logAction(actionName, caller, details, result) {
    this.actionHistory.unshift({
      timestamp: new Date().toLocaleTimeString(),
      action: actionName,
      caller,
      details,
      result,
      invariants: this.evaluateInvariants(),
    });
    if (this.actionHistory.length > 20) this.actionHistory.pop();
  }

  evaluateInvariants() {
    const invSupply = (this.circulatingSupply + this.totalUnmintedAccrual) <= this.maxSupply;
    const invAccounting = (this.circulatingSupply + this.totalBurned + this.totalUnmintedAccrual + this.remainingIssuanceBudget) === this.maxSupply;
    const invBranches = this.charters.every((c) => c.activeBranches <= c.maxBranches);
    const invBudget = this.remainingIssuanceBudget >= 0;

    return {
      'INV-SUPPLY-001': invSupply ? 'PASS' : 'FAIL',
      'INV-ACCOUNTING-001': invAccounting ? 'PASS' : 'FAIL',
      'INV-BRANCH-001': invBranches ? 'PASS' : 'FAIL',
      'INV-SUPPLY-002': invBudget ? 'PASS' : 'FAIL',
    };
  }

  getStateSnapshot() {
    return {
      maxSupply: this.maxSupply,
      circulatingSupply: this.circulatingSupply,
      totalUnmintedAccrual: this.totalUnmintedAccrual,
      totalBurned: this.totalBurned,
      remainingIssuanceBudget: this.remainingIssuanceBudget,
      currentEpoch: this.currentEpoch,
      policyRegime: this.policyRegime,
      activeChartersCount: this.charters.filter((c) => c.status === 'Active').length,
      activeBranchesCount: this.branches.filter((b) => b.status === 'Active').length,
      charters: this.charters,
      branches: this.branches,
      history: this.actionHistory,
      invariants: this.evaluateInvariants(),
    };
  }
}
