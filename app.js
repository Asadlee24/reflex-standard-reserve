import { simulate, MODEL_DEFAULTS } from './lib/model.js';
import { resultToCsv, downloadText } from './lib/export.js';
import { ReflexSculpture } from './lib/sculpture3d.js';
import { loadSpecLabData, SPEC_DOMAINS } from './lib/speclab-data.js';
import { renderProvenanceChain } from './lib/provenance.js';
import { TraceLabPlayer } from './lib/tracelab.js';
import { LiveSpecEngine } from './lib/spec-engine.js';
import { generateResearchReport } from './lib/report.js';

// DOM selector helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// State Management
const state = {
  theme: 'light',
  config: { ...MODEL_DEFAULTS },
  result: null,
  activeRoundIndex: 0,
  visibleSeries: { exit: true, fee: true, pressure: true },
  sculpture: null,
  speclab: null,
  activeSpecDomain: 'ALL',
  selectedRuleId: 'SR-SUPPLY-001',
  activeInvFilter: 'ALL',
  tracePlayer: null,
  sandbox: new LiveSpecEngine(100_000_000, 10_000_000),
};

// Formatters
const formatPct = (v, digits = 1) => `${(v * 100).toFixed(digits)}%`;
const formatNum = (v, digits = 2) => Number(v).toFixed(digits);

// ==========================================================================
// THEME MANAGEMENT
// ==========================================================================
function initTheme() {
  const saved = localStorage.getItem('reflex_theme');
  const initialTheme = saved === 'dark' ? 'dark' : 'light';
  setTheme(initialTheme);

  $('#themeToggleBtn')?.addEventListener('click', () => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });
}

function setTheme(theme) {
  state.theme = theme;
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('reflex_theme', theme);

  if (state.sculpture) {
    state.sculpture.setTheme(theme);
  }

  if (state.result) {
    drawTrajectory(state.result);
  }
}

// ==========================================================================
// TOAST POPUP HELPER
// ==========================================================================
function showToast(message) {
  const toast = $('#copyToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ==========================================================================
// URL PARAMETER HYDRATION & SHARING
// ==========================================================================
function hydrateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('shock')) state.config.initialShock = parseFloat(params.get('shock')) / 100;
  if (params.has('contagion')) state.config.contagionStrength = parseFloat(params.get('contagion'));
  if (params.has('deterrence')) state.config.feeDeterrence = parseFloat(params.get('deterrence'));
  if (params.has('floor')) state.config.feeFloor = parseFloat(params.get('floor')) / 100;
  if (params.has('ceiling')) state.config.feeCeiling = parseFloat(params.get('ceiling')) / 100;
  if (params.has('saturation')) state.config.feeSaturation = parseFloat(params.get('saturation')) / 100;
  if (params.has('horizon')) state.config.horizon = parseInt(params.get('horizon'), 10);
  syncInputs();
}

function generateShareUrl() {
  const c = state.config;
  const params = new URLSearchParams({
    shock: Math.round(c.initialShock * 100),
    contagion: c.contagionStrength,
    deterrence: c.feeDeterrence,
    floor: Math.round(c.feeFloor * 100),
    ceiling: Math.round(c.feeCeiling * 100),
    saturation: Math.round(c.feeSaturation * 100),
    horizon: c.horizon,
  });
  return `${window.location.origin}${window.location.pathname}?${params.toString()}#dynamics`;
}

// ==========================================================================
// MODULE 01: DYNAMICS (EXIT FEEDBACK SIMULATOR)
// ==========================================================================
function initDynamics() {
  bindSlider('inputInitialShock', 'valInitialShock', (v) => (state.config.initialShock = v / 100), (v) => `${v}%`);
  bindSlider('inputContagion', 'valContagion', (v) => (state.config.contagionStrength = v), (v) => Number(v).toFixed(1));
  bindSlider('inputDeterrence', 'valDeterrence', (v) => (state.config.feeDeterrence = v), (v) => Number(v).toFixed(1));
  bindSlider('inputFeeFloor', 'valFeeFloor', (v) => (state.config.feeFloor = v / 100), (v) => `${v}%`);
  bindSlider('inputFeeCeiling', 'valFeeCeiling', (v) => (state.config.feeCeiling = v / 100), (v) => `${v}%`);
  bindSlider('inputSaturation', 'valSaturation', (v) => (state.config.feeSaturation = v / 100), (v) => `${v}%`);
  bindSlider('inputHorizon', 'valHorizon', (v) => (state.config.horizon = parseInt(v, 10)), (v) => `${v} rds`);

  // Presets
  $$('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      $$('.preset-btn').forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const preset = e.currentTarget.dataset.preset;
      applyPreset(preset);
    });
  });

  // Run button
  $('#btnRunModel')?.addEventListener('click', runSimulation);

  // Reset button
  $('#btnResetControls')?.addEventListener('click', () => {
    state.config = { ...MODEL_DEFAULTS };
    syncInputs();
    runSimulation();
  });

  // Share scenario link
  $('#btnShareScenario')?.addEventListener('click', () => {
    const url = generateShareUrl();
    navigator.clipboard.writeText(url);
    showToast('Shareable scenario link copied!');
  });

  // Academic report generator
  $('#btnAcademicReport')?.addEventListener('click', () => {
    if (!state.result) runSimulation();
    const htmlReport = generateResearchReport({ result: state.result });
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlReport);
      win.document.close();
    }
  });

  // Chart series toggles
  $('#toggleSeriesExit')?.addEventListener('change', (e) => {
    state.visibleSeries.exit = e.target.checked;
    if (state.result) drawTrajectory(state.result);
  });
  $('#toggleSeriesFee')?.addEventListener('change', (e) => {
    state.visibleSeries.fee = e.target.checked;
    if (state.result) drawTrajectory(state.result);
  });
  $('#toggleSeriesPressure')?.addEventListener('change', (e) => {
    state.visibleSeries.pressure = e.target.checked;
    if (state.result) drawTrajectory(state.result);
  });

  // Exports
  $('#btnExportCsv')?.addEventListener('click', () => {
    if (!state.result) return;
    const csv = resultToCsv(state.result);
    downloadText('reflex-dynamics.csv', csv, 'text/csv');
    showToast('Exported dynamics to CSV');
  });

  $('#btnExportJson')?.addEventListener('click', () => {
    if (!state.result) return;
    const json = JSON.stringify(state.result, null, 2);
    downloadText('reflex-dynamics.json', json, 'application/json');
    showToast('Exported dynamics to JSON');
  });

  hydrateFromUrl();
  runSimulation();
}

function bindSlider(inputId, valId, updateFn, formatFn) {
  const input = $(`#${inputId}`);
  const valDisplay = $(`#${valId}`);
  if (!input || !valDisplay) return;

  input.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    updateFn(val);
    valDisplay.textContent = formatFn(val);
    runSimulation();
  });
}

function syncInputs() {
  const c = state.config;
  setVal('inputInitialShock', 'valInitialShock', c.initialShock * 100, `${Math.round(c.initialShock * 100)}%`);
  setVal('inputContagion', 'valContagion', c.contagionStrength, c.contagionStrength.toFixed(1));
  setVal('inputDeterrence', 'valDeterrence', c.feeDeterrence, c.feeDeterrence.toFixed(1));
  setVal('inputFeeFloor', 'valFeeFloor', c.feeFloor * 100, `${Math.round(c.feeFloor * 100)}%`);
  setVal('inputFeeCeiling', 'valFeeCeiling', c.feeCeiling * 100, `${Math.round(c.feeCeiling * 100)}%`);
  setVal('inputSaturation', 'valSaturation', c.feeSaturation * 100, `${Math.round(c.feeSaturation * 100)}%`);
  setVal('inputHorizon', 'valHorizon', c.horizon, `${c.horizon} rds`);
}

function setVal(inputId, valId, value, displayStr) {
  const input = $(`#${inputId}`);
  const display = $(`#${valId}`);
  if (input) input.value = value;
  if (display) display.textContent = displayStr;
}

function applyPreset(preset) {
  if (preset === 'baseline') {
    state.config = { ...MODEL_DEFAULTS };
  } else if (preset === 'contagion') {
    state.config = { ...MODEL_DEFAULTS, initialShock: 0.15, contagionStrength: 24, feeDeterrence: 4 };
  } else if (preset === 'deterrence') {
    state.config = { ...MODEL_DEFAULTS, initialShock: 0.10, contagionStrength: 12, feeDeterrence: 14 };
  }
  syncInputs();
  runSimulation();
}

function runSimulation() {
  try {
    state.result = simulate(state.config);
    renderResults(state.result);
    drawTrajectory(state.result);

    if (state.sculpture) {
      state.sculpture.updateState({
        classification: state.result.classification,
        exitRate: state.result.rounds[0]?.exitRate || 0.1,
        pressure: state.result.rounds[0]?.pressureAfter || 0.1,
        fee: state.result.rounds[0]?.feeAfter || 0.05,
      });
    }
  } catch (err) {
    console.error('Simulation error', err);
  }
}

function renderResults(result) {
  const banner = $('#classificationBanner');
  const badge = $('#classificationBadge');
  const reason = $('#classificationReason');

  if (banner && badge && reason) {
    banner.setAttribute('data-state', result.classification);
    badge.textContent = `${result.classification.toUpperCase()} REGIME`;
    reason.textContent = result.classificationReason;
  }

  $('#metricRemaining').textContent = formatPct(result.finalRemainingShare);
  $('#metricExited').textContent = formatPct(result.cumulativeExitedShare);
  $('#metricBurned').textContent = formatPct(result.totalBurnShare);
  $('#metricRedistributed').textContent = formatPct(result.totalRedistributionShare);
}

function drawTrajectory(result) {
  const svg = $('#trajectoryChartSvg');
  if (!svg || !result.rounds.length) return;

  const w = 700;
  const h = 220;
  const pad = { top: 20, right: 30, bottom: 30, left: 40 };
  const rounds = result.rounds;
  const n = rounds.length;

  const getX = (idx) => pad.left + (idx / Math.max(1, n - 1)) * (w - pad.left - pad.right);
  const getY = (val) => h - pad.bottom - val * (h - pad.top - pad.bottom);

  let pathsHtml = `
    <line x1="${pad.left}" y1="${h - pad.bottom}" x2="${w - pad.right}" y2="${h - pad.bottom}" stroke="var(--border)" stroke-width="1" />
    <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${h - pad.bottom}" stroke="var(--border)" stroke-width="1" />
  `;

  // Draw exit rate line
  if (state.visibleSeries.exit) {
    const exitD = rounds.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.exitRate)}`).join(' ');
    pathsHtml += `<path d="${exitD}" fill="none" stroke="#e05252" stroke-width="2.5" />`;
  }

  // Draw fee rate line
  if (state.visibleSeries.fee) {
    const feeD = rounds.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.feeAfter)}`).join(' ');
    pathsHtml += `<path d="${feeD}" fill="none" stroke="#c5a059" stroke-width="2" stroke-dasharray="4 3" />`;
  }

  // Draw pressure line
  if (state.visibleSeries.pressure) {
    const pressD = rounds.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.pressureAfter)}`).join(' ');
    pathsHtml += `<path d="${pressD}" fill="none" stroke="#4a90e2" stroke-width="1.5" stroke-dasharray="2 2" />`;
  }

  svg.innerHTML = pathsHtml;
}

// ==========================================================================
// MODULE 02: SPEC LAB (3-PANE SPECIFICATION BROWSER)
// ==========================================================================
function initSpecLab(data) {
  state.speclab = data;
  renderSpecDomains();
  renderSpecRules();
  selectSpecRule(state.selectedRuleId);

  // Search
  $('#inputSearchRules')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    renderSpecRules(query);
  });

  // Listen to 3D node clicks
  window.addEventListener('reflex:domain-select', (e) => {
    const domain = e.detail.domain;
    setSpecDomain(domain);
    const targetSection = document.getElementById('speclab');
    targetSection?.scrollIntoView({ behavior: 'smooth' });
  });
}

function renderSpecDomains() {
  const container = $('#domainFilterList');
  if (!container) return;

  container.innerHTML = SPEC_DOMAINS.map((d) => `
    <button class="domain-btn ${state.activeSpecDomain === d.id ? 'active' : ''}" data-domain="${d.id}">
      <span>${d.label}</span>
      <span class="domain-count">${d.count}</span>
    </button>
  `).join('');

  container.querySelectorAll('.domain-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const domain = e.currentTarget.dataset.domain;
      setSpecDomain(domain);
    });
  });
}

function setSpecDomain(domain) {
  state.activeSpecDomain = domain;
  renderSpecDomains();
  renderSpecRules();
  if (state.sculpture) {
    state.sculpture.focusDomain(domain === 'ALL' ? null : domain);
  }
}

function renderSpecRules(query = '') {
  const container = $('#rulesScrollList');
  if (!container || !state.speclab) return;

  let rules = state.speclab.rules;
  if (state.activeSpecDomain !== 'ALL') {
    rules = rules.filter((r) => r.domain === state.activeSpecDomain);
  }
  if (query) {
    rules = rules.filter((r) => r.id.toLowerCase().includes(query) || r.title.toLowerCase().includes(query) || r.summary.toLowerCase().includes(query));
  }

  $('#ruleCountDisplay').textContent = rules.length;

  container.innerHTML = rules.map((r) => `
    <div class="rule-item-card ${r.id === state.selectedRuleId ? 'active' : ''}" data-rule-id="${r.id}">
      <div class="rule-card-top">
        <span class="rule-id">${r.id}</span>
        <span class="rule-classification ${r.classification.toLowerCase()}">${r.classification}</span>
      </div>
      <div class="rule-card-title">${r.title}</div>
      <div class="rule-card-summary">${r.summary}</div>
    </div>
  `).join('');

  container.querySelectorAll('.rule-item-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      const ruleId = e.currentTarget.dataset.ruleId;
      selectSpecRule(ruleId);
    });
  });
}

function selectSpecRule(ruleId) {
  state.selectedRuleId = ruleId;
  renderSpecRules($('#inputSearchRules')?.value.toLowerCase() || '');

  const pane = $('#specDetailPane');
  if (!pane || !state.speclab) return;

  const rule = state.speclab.rules.find((r) => r.id === ruleId) || state.speclab.rules[0];
  pane.innerHTML = renderProvenanceChain(rule.id, state.speclab.rules, state.speclab.invariants);

  // Update standalone provenance graph as well
  const provViewer = $('#provenanceViewer');
  if (provViewer) {
    provViewer.innerHTML = renderProvenanceChain(rule.id, state.speclab.rules, state.speclab.invariants);
  }
}

// ==========================================================================
// MODULE: INTERACTIVE SPEC SANDBOX
// ==========================================================================
function initSandbox() {
  updateSandboxUI();

  $('#btnSandboxReset')?.addEventListener('click', () => {
    state.sandbox.reset();
    updateSandboxUI();
    showToast('Sandbox reset to Genesis state');
  });

  $('#actCreateCharter')?.addEventListener('click', () => {
    try {
      state.sandbox.createCharter('0xBanker', 3);
      updateSandboxUI();
      showToast('Charter created (Max: 3)');
    } catch (e) {
      showToast(e.message);
    }
  });

  $('#actOpenBranch')?.addEventListener('click', () => {
    try {
      const activeCharters = state.sandbox.charters.filter((c) => c.status === 'Active');
      if (!activeCharters.length) {
        state.sandbox.createCharter('0xBanker', 3);
      }
      const charter = state.sandbox.charters.find((c) => c.status === 'Active' && c.activeBranches < c.maxBranches);
      if (!charter) {
        throw new Error('All active charters at capacity. Create a new charter first.');
      }
      state.sandbox.openBranch(charter.id);
      updateSandboxUI();
      showToast(`Branch opened under Charter #${charter.id}`);
    } catch (e) {
      showToast(e.message);
      updateSandboxUI();
    }
  });

  $('#actAccrue')?.addEventListener('click', () => {
    try {
      const activeBranches = state.sandbox.branches.filter((b) => b.status === 'Active');
      if (!activeBranches.length) {
        throw new Error('No active branch found. Open a branch first.');
      }
      state.sandbox.accrueIssuance(activeBranches[0].id, 250_000);
      updateSandboxUI();
      showToast('Accrued +250,000 $STANDARD');
    } catch (e) {
      showToast(e.message);
      updateSandboxUI();
    }
  });

  $('#actResolve')?.addEventListener('click', () => {
    try {
      const activeBranches = state.sandbox.branches.filter((b) => b.status === 'Active');
      if (!activeBranches.length) {
        throw new Error('No active branch to resolve.');
      }
      const realized = state.sandbox.resolveBranch(activeBranches[0].id);
      updateSandboxUI();
      showToast(`Branch resolved! Realized ${realized.toLocaleString()} $STANDARD`);
    } catch (e) {
      showToast(e.message);
      updateSandboxUI();
    }
  });

  $('#actBurn')?.addEventListener('click', () => {
    try {
      state.sandbox.burnTokens(100_000);
      updateSandboxUI();
      showToast('Burned 100,000 $STANDARD');
    } catch (e) {
      showToast(e.message);
      updateSandboxUI();
    }
  });

  $('#actAdvanceEpoch')?.addEventListener('click', () => {
    state.sandbox.advanceEpoch(500);
    updateSandboxUI();
    showToast(`Advanced to Epoch ${state.sandbox.currentEpoch}`);
  });
}

function updateSandboxUI() {
  const snap = state.sandbox.getStateSnapshot();

  $('#sbCirculating').textContent = snap.circulatingSupply.toLocaleString();
  $('#sbAccruals').textContent = snap.totalUnmintedAccrual.toLocaleString();
  $('#sbBudget').textContent = snap.remainingIssuanceBudget.toLocaleString();
  $('#sbBurned').textContent = snap.totalBurned.toLocaleString();
  $('#sbCharters').textContent = snap.activeChartersCount;
  $('#sbBranches').textContent = snap.activeBranchesCount;

  // Invariant badges
  updateInvBadge('#pillInvSupply', 'INV-SUPPLY-001', snap.invariants['INV-SUPPLY-001']);
  updateInvBadge('#pillInvAccounting', 'INV-ACCOUNTING-001', snap.invariants['INV-ACCOUNTING-001']);
  updateInvBadge('#pillInvBranch', 'INV-BRANCH-001', snap.invariants['INV-BRANCH-001']);
  updateInvBadge('#pillInvBudget', 'INV-SUPPLY-002', snap.invariants['INV-SUPPLY-002']);

  // History stream
  const histEl = $('#sbActionHistory');
  if (histEl) {
    histEl.innerHTML = snap.history.map((h) => `
      <div class="hist-item ${h.result.startsWith('REVERT') ? 'revert' : 'success'}">
        <div>
          <span><strong>${h.action}</strong></span>
          <span style="color: var(--ink-muted); margin-left: 6px;">by ${h.caller}</span>
        </div>
        <div>
          <span class="hist-time">${h.timestamp}</span>
        </div>
      </div>
    `).join('');
  }
}

function updateInvBadge(sel, name, status) {
  const el = $(sel);
  if (!el) return;
  el.className = `sb-inv-pill ${status === 'PASS' ? 'pass' : 'fail'}`;
  el.innerHTML = `${name}: <strong>${status}</strong>`;
}

// ==========================================================================
// MODULE 03: INVARIANT REGISTRY
// ==========================================================================
function initInvariants(data) {
  renderInvariantsTable(data.invariants);

  $('#invFilterPills')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    $$('.filter-pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    state.activeInvFilter = pill.dataset.filter;
    renderInvariantsTable(data.invariants);
  });
}

function renderInvariantsTable(invariants) {
  const tbody = $('#invariantsTableBody');
  if (!tbody) return;

  let filtered = invariants;
  if (state.activeInvFilter !== 'ALL') {
    filtered = filtered.filter((i) => i.domain === state.activeInvFilter);
  }

  tbody.innerHTML = filtered.map((inv) => `
    <tr>
      <td><code>${inv.id}</code></td>
      <td><strong>${inv.domain}</strong></td>
      <td><code>${inv.formalProperty}</code></td>
      <td><a href="#speclab" class="rule-link" data-rule="${inv.sourceRule}"><code>${inv.sourceRule}</code></a></td>
      <td><span class="inv-status-tag ${inv.classification.toLowerCase()}">${inv.classification}</span></td>
      <td><span class="inv-status-tag ${inv.status.toLowerCase()}">${inv.status}</span></td>
      <td>
        <button class="btn-table-action btn-copy-forge" data-cmd="forge test --match-test invariant_${inv.id.replace(/-/g, '_')} -vvv">
          Copy Test Cmd
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-copy-forge').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const cmd = e.currentTarget.dataset.cmd;
      navigator.clipboard.writeText(cmd);
      showToast(`Copied: ${cmd}`);
    });
  });

  tbody.querySelectorAll('.rule-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      const ruleId = e.currentTarget.dataset.rule;
      selectSpecRule(ruleId);
    });
  });
}

// ==========================================================================
// MODULE 04: TRACE LAB
// ==========================================================================
function initTraceLab(traces) {
  const container = $('#traceLabContainer');
  if (container && traces.length) {
    state.tracePlayer = new TraceLabPlayer(container, traces);
  }
}

// ==========================================================================
// COMMAND PALETTE (CTRL+K / CMD+K)
// ==========================================================================
function initCommandPalette() {
  const modal = $('#cmdPaletteModal');
  const input = $('#cmdInput');
  const list = $('#cmdResultsList');

  const commands = [
    { label: 'Jump to Overview', category: 'Navigation', action: () => scrollTo('#overview') },
    { label: 'Jump to Dynamics Simulation', category: 'Navigation', action: () => scrollTo('#dynamics') },
    { label: 'Jump to SpecLab Specification', category: 'Navigation', action: () => scrollTo('#speclab') },
    { label: 'Jump to Spec Sandbox', category: 'Interactive', action: () => scrollTo('#sandbox') },
    { label: 'Jump to Invariant Registry', category: 'Navigation', action: () => scrollTo('#invariants') },
    { label: 'Jump to Trace Lab Replayer', category: 'Navigation', action: () => scrollTo('#tracelab') },
    { label: 'Jump to Provenance Graph', category: 'Navigation', action: () => scrollTo('#provenance') },
    { label: 'Jump to Assumptions Matrix', category: 'Navigation', action: () => scrollTo('#assumptions') },
    { label: 'Generate Academic PDF Research Report', category: 'Report', action: () => $('#btnAcademicReport')?.click() },
    { label: 'Copy Shareable Scenario URL', category: 'Share', action: () => $('#btnShareScenario')?.click() },
    { label: 'Toggle Light / Dark Theme', category: 'Theme', action: () => setTheme(state.theme === 'dark' ? 'light' : 'dark') },
    { label: 'Copy Full Forge Invariant Test Command', category: 'Developer', action: () => {
      navigator.clipboard.writeText('forge test --gas-report -vvv');
      showToast('Copied: forge test --gas-report -vvv');
    }},
    { label: 'Open GitHub Repository (Built by Asad Lee)', category: 'External', action: () => {
      window.open('https://github.com/Asadlee24/reflex-standard-reserve', '_blank');
    }},
  ];

  function openPalette() {
    modal?.classList.add('open');
    input?.focus();
    renderCmds(commands);
  }

  function closePalette() {
    modal?.classList.remove('open');
    if (input) input.value = '';
  }

  function scrollTo(hash) {
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
  }

  function renderCmds(items) {
    if (!list) return;
    list.innerHTML = items.map((c, idx) => `
      <div class="cmd-item" data-idx="${idx}">
        <span>${c.label}</span>
        <span class="cmd-category">${c.category}</span>
      </div>
    `).join('');

    list.querySelectorAll('.cmd-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        commands[idx].action();
        closePalette();
      });
    });
  }

  $('#btnCmdPalette')?.addEventListener('click', openPalette);

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      modal?.classList.contains('open') ? closePalette() : openPalette();
    }
    if (e.key === 'Escape' && modal?.classList.contains('open')) {
      closePalette();
    }
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closePalette();
  });

  input?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = commands.filter((c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    renderCmds(filtered);
  });
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
async function initApp() {
  initTheme();

  // 3D REFLEX Core Sculpture
  const canvasContainer = $('#sculptureCanvasContainer');
  if (canvasContainer) {
    state.sculpture = new ReflexSculpture(canvasContainer, { theme: state.theme });
  }

  // Load SpecLab Data
  const specData = await loadSpecLabData();

  // Initialize Modules
  initDynamics();
  initSpecLab(specData);
  initSandbox();
  initInvariants(specData);
  initTraceLab(specData.traces);
  initCommandPalette();

  console.log('REFLEX — Standard Reserve Research Laboratory loaded.');
}

document.addEventListener('DOMContentLoaded', initApp);
