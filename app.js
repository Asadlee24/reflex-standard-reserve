import { simulate, MODEL_DEFAULTS } from './lib/model.js';
import { stabilitySweep } from './lib/sweep.js';
import { resultToCsv, downloadText } from './lib/export.js';
import { sourceRegistry } from './lib/mechanism.js';
import { ReflexSculpture } from './lib/sculpture3d.js';

// DOM selector helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// State Management
const state = {
  theme: 'light',
  config: { ...MODEL_DEFAULTS },
  result: null,
  sweep: null,
  activeRoundIndex: 0,
  isPlaying: false,
  playTimer: null,
  visibleSeries: { exit: true, fee: true, pressure: true },
  sculpture: null,
};

// Resolved color helper (gets actual CSS custom property value)
function resolveColor(cssVar, fallback) {
  const val = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return val || fallback;
}

// Number and percentage formatters
const formatPct = (v, digits = 1) => `${(v * 100).toFixed(digits)}%`;
const formatNum = (v, digits = 2) => Number(v).toFixed(digits);

// ==========================================================================
// THEME MANAGEMENT (Default: Light Mode)
// ==========================================================================
function initTheme() {
  const saved = localStorage.getItem('reflex_theme');
  // Default is LIGHT unless the user explicitly saved 'dark' previously
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

  // Update 3D sculpture theme
  if (state.sculpture) {
    state.sculpture.setTheme(theme);
  }

  // Redraw canvas heatmap
  if (state.sweep) {
    drawHeatmap();
  }

  // Redraw SVG trajectory chart
  if (state.result) {
    drawTrajectory(state.result);
  }
}

// ==========================================================================
// URL QUERY STATE
// ==========================================================================
function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('shock')) state.config.initialShock = Number(params.get('shock')) / 100;
  if (params.has('contagion')) state.config.contagionStrength = Number(params.get('contagion'));
  if (params.has('deterrence')) state.config.feeDeterrence = Number(params.get('deterrence'));
  if (params.has('floor')) state.config.feeFloor = Number(params.get('floor')) / 100;
  if (params.has('ceiling')) state.config.feeCeiling = Number(params.get('ceiling')) / 100;
  if (params.has('saturation')) state.config.feeSaturation = Number(params.get('saturation')) / 100;
  if (params.has('horizon')) state.config.horizon = Number(params.get('horizon'));
}

function syncInputsFromConfig() {
  $('#inputInitialShock').value = Math.round(state.config.initialShock * 100);
  $('#inputContagion').value = state.config.contagionStrength;
  $('#inputDeterrence').value = state.config.feeDeterrence;
  $('#inputFeeFloor').value = Math.round(state.config.feeFloor * 100);
  $('#inputFeeCeiling').value = Math.round(state.config.feeCeiling * 100);
  $('#inputSaturation').value = Math.round(state.config.feeSaturation * 100);
  $('#inputHorizon').value = state.config.horizon;
  syncControlLabels();
}

function syncConfigFromInputs() {
  state.config = {
    ...MODEL_DEFAULTS,
    initialShock: Number($('#inputInitialShock').value) / 100,
    contagionStrength: Number($('#inputContagion').value),
    feeDeterrence: Number($('#inputDeterrence').value),
    feeFloor: Number($('#inputFeeFloor').value) / 100,
    feeCeiling: Number($('#inputFeeCeiling').value) / 100,
    feeSaturation: Number($('#inputSaturation').value) / 100,
    horizon: Number($('#inputHorizon').value),
  };
}

function syncControlLabels() {
  $('#valInitialShock').textContent = `${$('#inputInitialShock').value}%`;
  $('#valContagion').textContent = Number($('#inputContagion').value).toFixed(1);
  $('#valDeterrence').textContent = Number($('#inputDeterrence').value).toFixed(1);
  $('#valFeeFloor').textContent = `${$('#inputFeeFloor').value}%`;
  $('#valFeeCeiling').textContent = `${$('#inputFeeCeiling').value}%`;
  $('#valSaturation').textContent = `${$('#inputSaturation').value}%`;
  $('#valHorizon').textContent = `${$('#inputHorizon').value} rds`;
}

function showToast(msg) {
  const toast = $('#toastMessage');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function shareScenario() {
  const params = new URLSearchParams({
    shock: Math.round(state.config.initialShock * 100),
    contagion: state.config.contagionStrength,
    deterrence: state.config.feeDeterrence,
    floor: Math.round(state.config.feeFloor * 100),
    ceiling: Math.round(state.config.feeCeiling * 100),
    saturation: Math.round(state.config.feeSaturation * 100),
    horizon: state.config.horizon,
  });
  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}#simulation`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Scenario link copied to clipboard!');
    }).catch(() => {
      window.history.replaceState(null, '', url);
      showToast('Scenario URL updated in address bar');
    });
  } else {
    window.history.replaceState(null, '', url);
    showToast('Scenario URL updated in address bar');
  }
}

// ==========================================================================
// SIMULATION & METRICS RENDERING
// ==========================================================================
function updateClassificationBanner(result) {
  const banner = $('#classificationBanner');
  const verdictText = $('#verdictText');
  const verdictSummary = $('#verdictSummary');
  const verdictReason = $('#verdictReason');

  const classification = result.classification;
  banner.dataset.state = classification;

  if (classification === 'stable') {
    verdictText.textContent = 'STABLE';
    verdictSummary.textContent = 'Under these assumptions, exit activity converges below the stability threshold.';
  } else if (classification === 'cascade') {
    verdictText.textContent = 'CASCADE';
    verdictSummary.textContent = 'Under these assumptions, repeated exit activity compounds into a self-reinforcing run.';
  } else {
    verdictText.textContent = 'BORDERLINE';
    verdictSummary.textContent = 'Under these assumptions, the exit trajectory remains unresolved within the horizon.';
  }

  verdictReason.textContent = result.classificationReason;
}

function updateRoundMetrics(roundData, result) {
  $('#statPressure').textContent = formatPct(roundData.pressureAfter, 1);
  $('#statFee').textContent = formatPct(roundData.feeAfter, 1);
  $('#statRemaining').textContent = Math.round(roundData.participantsRemaining).toLocaleString();
  $('#statCumulative').textContent = formatPct(roundData.cumulativeExitedShare, 1);
  $('#statBurn').textContent = formatPct(result.totalBurnShare, 2);
  $('#statRedistrib').textContent = formatPct(result.totalRedistributionShare, 2);

  // Update mechanism flow summary cards
  $('#cardShockVal').textContent = `${Math.round(state.config.initialShock * 100)}%`;
  $('#cardPressureVal').textContent = formatNum(roundData.pressureAfter, 3);
  $('#cardFeeVal').textContent = formatPct(roundData.feeAfter, 1);
  $('#cardResponseVal').textContent = roundData.behavioralScore == null ? 'Exogenous' : formatNum(roundData.behavioralScore, 2);

  // Update 3D sculpture node weights
  if (state.sculpture) {
    state.sculpture.updateState({
      classification: result.classification,
      activeRound: roundData.round,
      exitRate: roundData.exitRate,
      pressure: roundData.pressureAfter,
      fee: roundData.feeAfter,
      responseScore: roundData.behavioralScore,
    });
  }

  // Highlight active table row
  $$('#traceTableBody tr').forEach((tr, i) => {
    if (i === roundData.round) {
      tr.classList.add('active-row');
    } else {
      tr.classList.remove('active-row');
    }
  });
}

// ==========================================================================
// TRAJECTORY CHART (SVG)
// ==========================================================================
function linePath(values, width, height, maxY = 1) {
  if (!values.length) return '';
  const padX = 24;
  const padY = 20;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  return values.map((v, i) => {
    const x = padX + (values.length === 1 ? 0 : (i / (values.length - 1)) * usableW);
    const y = padY + usableH - (Math.min(maxY, Math.max(0, v)) / maxY) * usableH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

function drawTrajectory(result) {
  const svg = $('#trajectorySvg');
  if (!svg) return;

  const width = 860;
  const height = 280;

  const exit = result.rounds.map((r) => r.exitRate);
  const fee = result.rounds.map((r) => r.feeAfter);
  const pressure = result.rounds.map((r) => r.pressureAfter);
  const maxY = Math.max(0.12, ...exit, ...fee, ...pressure) * 1.15;

  svg.innerHTML = '';

  // Resolve colors at draw time
  const isDark = state.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,20,18,0.08)';
  const textColor = isDark ? '#6B6A62' : '#88877E';
  const exitColor = isDark ? '#F3F3EE' : '#141412';
  const feeColor  = isDark ? '#F87171' : '#B82E2B';
  const presColor = isDark ? '#FBBF24' : '#A36B15';
  const cursorColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(20,20,18,0.25)';

  // Background Grid Lines
  for (let i = 0; i <= 4; i++) {
    const y = 20 + ((height - 40) * i / 4);
    const val = (maxY * (4 - i) / 4);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '24');
    line.setAttribute('x2', String(width - 24));
    line.setAttribute('y1', String(y));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', gridColor);
    line.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(line);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '28');
    label.setAttribute('y', String(y - 4));
    label.setAttribute('font-family', 'JetBrains Mono, monospace');
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', textColor);
    label.textContent = `${(val * 100).toFixed(0)}%`;
    svg.appendChild(label);
  }

  // Draw Series Paths
  const seriesDefs = [
    { id: 'exit',     values: exit,     stroke: exitColor, width: 2.2, dash: '' },
    { id: 'fee',      values: fee,      stroke: feeColor,  width: 1.8, dash: '' },
    { id: 'pressure', values: pressure, stroke: presColor, width: 1.5, dash: '5 4' },
  ];

  seriesDefs.forEach((s) => {
    if (!state.visibleSeries[s.id]) return;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', linePath(s.values, width, height, maxY));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', s.stroke);
    path.setAttribute('stroke-width', String(s.width));
    if (s.dash) path.setAttribute('stroke-dasharray', s.dash);
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(path);
  });

  // Active round cursor
  if (result.rounds.length > 1) {
    const padX = 24;
    const usableW = width - padX * 2;
    const activeX = padX + (state.activeRoundIndex / (result.rounds.length - 1)) * usableW;
    const cursorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    cursorLine.setAttribute('x1', String(activeX));
    cursorLine.setAttribute('x2', String(activeX));
    cursorLine.setAttribute('y1', '16');
    cursorLine.setAttribute('y2', String(height - 16));
    cursorLine.setAttribute('stroke', cursorColor);
    cursorLine.setAttribute('stroke-width', '1.5');
    cursorLine.setAttribute('stroke-dasharray', '4 3');
    svg.appendChild(cursorLine);
  }
}

// ==========================================================================
// ROUND-BY-ROUND TRACE TABLE
// ==========================================================================
function updateTraceTable(result) {
  const tbody = $('#traceTableBody');
  if (!tbody) return;
  tbody.innerHTML = result.rounds.map((r, idx) => `
    <tr data-round="${idx}">
      <td>${r.round + 1}</td>
      <td>${formatPct(r.exitRate, 2)}</td>
      <td>${formatPct(r.pressureAfter, 2)}</td>
      <td>${formatPct(r.feeAfter, 2)}</td>
      <td>${Math.round(r.participantsRemaining).toLocaleString()}</td>
      <td>${formatPct(r.burnShare, 3)}</td>
      <td>${formatPct(r.redistributionShare, 3)}</td>
      <td>${r.behavioralScore == null ? 'shock' : formatNum(r.behavioralScore, 3)}</td>
    </tr>
  `).join('');

  $$('#traceTableBody tr').forEach((tr) => {
    tr.addEventListener('click', () => {
      const rIdx = Number(tr.dataset.round);
      setScrubberRound(rIdx);
    });
  });
}

// ==========================================================================
// SCRUBBER & PLAYBACK
// ==========================================================================
function setScrubberRound(idx) {
  if (!state.result) return;
  const maxIdx = state.result.rounds.length - 1;
  state.activeRoundIndex = Math.max(0, Math.min(maxIdx, idx));

  $('#roundScrubber').value = state.activeRoundIndex + 1;
  $('#scrubberLabel').textContent = `Round: ${state.activeRoundIndex + 1}/${state.result.rounds.length}`;

  const currentRound = state.result.rounds[state.activeRoundIndex];
  updateRoundMetrics(currentRound, state.result);
  drawTrajectory(state.result);
}

function togglePlay() {
  if (state.isPlaying) {
    pauseSimulation();
  } else {
    playSimulation();
  }
}

function playSimulation() {
  state.isPlaying = true;
  $('#playIcon').style.display = 'none';
  $('#pauseIcon').style.display = 'block';

  if (state.activeRoundIndex >= (state.result?.rounds.length || 1) - 1) {
    setScrubberRound(0);
  }

  state.playTimer = setInterval(() => {
    if (!state.result) return;
    if (state.activeRoundIndex < state.result.rounds.length - 1) {
      setScrubberRound(state.activeRoundIndex + 1);
    } else {
      pauseSimulation();
    }
  }, 320);
}

function pauseSimulation() {
  state.isPlaying = false;
  clearInterval(state.playTimer);
  $('#playIcon').style.display = 'block';
  $('#pauseIcon').style.display = 'none';
}

// ==========================================================================
// STABILITY MAP (651 Full Simulations)
// ==========================================================================
function heatColor(classification) {
  const isDark = state.theme === 'dark';
  if (classification === 'stable') return isDark ? '#4ADE80' : '#1F7A42';
  if (classification === 'cascade') return isDark ? '#F87171' : '#B82E2B';
  return isDark ? '#FBBF24' : '#A36B15';
}

function drawHeatmap() {
  const canvas = $('#stabilityHeatmapCanvas');
  if (!canvas || !state.sweep) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rect.width;
  const H = rect.height;

  const sweep = state.sweep;
  const cols = sweep.xValues.length;
  const rows = sweep.yValues.length;
  const cw = W / cols;
  const ch = H / rows;
  ctx.clearRect(0, 0, W, H);

  for (const cell of sweep.cells) {
    ctx.fillStyle = heatColor(cell.classification);
    ctx.globalAlpha = 0.88;
    const x = cell.xi * cw;
    const y = H - (cell.yi + 1) * ch;
    ctx.fillRect(x, y, Math.ceil(cw + 0.3), Math.ceil(ch + 0.3));
  }
  ctx.globalAlpha = 1;
}

function buildSweep() {
  state.sweep = stabilitySweep(state.config, {
    xMin: 0, xMax: 30, xSteps: 31,
    yMin: 0, yMax: 20, ySteps: 21,
  });
  // Defer canvas drawing to ensure layout is complete
  requestAnimationFrame(() => requestAnimationFrame(drawHeatmap));
}

function heatmapHover(event) {
  if (!state.sweep) return;
  const canvas = $('#stabilityHeatmapCanvas');
  const rect = canvas.getBoundingClientRect();
  const xNorm = (event.clientX - rect.left) / rect.width;
  const yNorm = 1 - (event.clientY - rect.top) / rect.height;

  const xi = Math.max(0, Math.min(state.sweep.xValues.length - 1, Math.floor(xNorm * state.sweep.xValues.length)));
  const yi = Math.max(0, Math.min(state.sweep.yValues.length - 1, Math.floor(yNorm * state.sweep.yValues.length)));
  const cell = state.sweep.cells.find((c) => c.xi === xi && c.yi === yi);
  if (!cell) return;

  const tip = $('#heatmapTooltip');
  tip.innerHTML = `
    <div class="heatmap-tooltip-title" style="color:${heatColor(cell.classification)}">
      ${cell.classification.toUpperCase()}
    </div>
    <div>Contagion: <b>${cell.contagionStrength.toFixed(1)}</b> · Deterrence: <b>${cell.feeDeterrence.toFixed(1)}</b></div>
    <div style="font-size:10px; color:var(--ink-muted); margin-top:2px;">
      Cumulative Exits: ${(cell.cumulativeExitedShare * 100).toFixed(1)}% · Click to load
    </div>
  `;
  tip.style.opacity = '1';
}

function heatmapClick(event) {
  if (!state.sweep) return;
  const canvas = $('#stabilityHeatmapCanvas');
  const rect = canvas.getBoundingClientRect();
  const xNorm = (event.clientX - rect.left) / rect.width;
  const yNorm = 1 - (event.clientY - rect.top) / rect.height;

  const xi = Math.max(0, Math.min(state.sweep.xValues.length - 1, Math.floor(xNorm * state.sweep.xValues.length)));
  const yi = Math.max(0, Math.min(state.sweep.yValues.length - 1, Math.floor(yNorm * state.sweep.yValues.length)));
  const cell = state.sweep.cells.find((c) => c.xi === xi && c.yi === yi);
  if (!cell) return;

  // Load selected parameters directly into the simulator
  $('#inputContagion').value = cell.contagionStrength;
  $('#inputDeterrence').value = cell.feeDeterrence;
  syncConfigFromInputs();
  syncControlLabels();
  runSimulation();
  showToast(`Loaded scenario: Contagion ${cell.contagionStrength.toFixed(1)}, Deterrence ${cell.feeDeterrence.toFixed(1)}`);
}

// ==========================================================================
// PRESETS
// ==========================================================================
function setPreset(name) {
  const presets = {
    baseline: { shock: 10, contagion: 18, deterrence: 8, floor: 2, ceiling: 40, saturation: 50 },
    contagion: { shock: 14, contagion: 26, deterrence: 4, floor: 2, ceiling: 40, saturation: 50 },
    deterrence: { shock: 14, contagion: 14, deterrence: 15, floor: 2, ceiling: 40, saturation: 50 },
  };
  const p = presets[name];
  if (!p) return;

  $('#inputInitialShock').value = p.shock;
  $('#inputContagion').value = p.contagion;
  $('#inputDeterrence').value = p.deterrence;
  $('#inputFeeFloor').value = p.floor;
  $('#inputFeeCeiling').value = p.ceiling;
  $('#inputSaturation').value = p.saturation;

  $$('.preset-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.preset === name);
  });

  syncConfigFromInputs();
  syncControlLabels();
  runSimulation();
}

// ==========================================================================
// MAIN RUN SIMULATION
// ==========================================================================
function runSimulation() {
  pauseSimulation();
  syncConfigFromInputs();

  state.result = simulate(state.config);
  state.activeRoundIndex = state.result.rounds.length - 1;

  // Update scrubber bounds
  const scrubber = $('#roundScrubber');
  scrubber.max = state.result.rounds.length;
  scrubber.value = state.result.rounds.length;
  $('#scrubberLabel').textContent = `Round: ${state.result.rounds.length}/${state.result.rounds.length}`;

  // Update DOM components
  updateClassificationBanner(state.result);
  updateTraceTable(state.result);
  drawTrajectory(state.result);
  updateRoundMetrics(state.result.rounds.at(-1), state.result);
  buildSweep();
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
function init() {
  // 1. Theme
  initTheme();

  // 2. 3D Sculpture
  const sculptureContainer = $('#sculptureCanvasContainer');
  if (sculptureContainer) {
    state.sculpture = new ReflexSculpture(sculptureContainer, { theme: state.theme });
  }

  // 3. URL Params & Initial Config
  readUrlParams();
  syncInputsFromConfig();

  // 4. Sliders Event Listeners
  $$('.range-slider').forEach((el) => {
    if (el.id === 'roundScrubber') return;
    el.addEventListener('input', () => {
      syncConfigFromInputs();
      syncControlLabels();
      runSimulation();
    });
  });

  // 5. Scrubber Input Event
  $('#roundScrubber')?.addEventListener('input', (e) => {
    pauseSimulation();
    setScrubberRound(Number(e.target.value) - 1);
  });

  // 6. Play / Pause Button
  $('#btnPlayPause')?.addEventListener('click', togglePlay);

  // 7. Preset Buttons
  $$('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => setPreset(btn.dataset.preset));
  });

  // 8. Reset & Run Buttons
  $('#btnResetControls')?.addEventListener('click', () => {
    state.config = { ...MODEL_DEFAULTS };
    syncInputsFromConfig();
    runSimulation();
    showToast('Reset parameters to baseline');
  });

  $('#btnRunModel')?.addEventListener('click', () => {
    runSimulation();
    showToast('Simulated scenario successfully');
  });

  // 9. Series Toggle Chips
  $$('.toggle-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const s = chip.dataset.series;
      state.visibleSeries[s] = !state.visibleSeries[s];
      chip.classList.toggle('active', state.visibleSeries[s]);
      if (state.result) drawTrajectory(state.result);
    });
  });

  // 10. Export CSV & JSON
  $('#btnExportCsv')?.addEventListener('click', () => {
    if (!state.result) return;
    downloadText('reflex-simulation.csv', resultToCsv(state.result), 'text/csv');
    showToast('Downloaded simulation CSV');
  });

  $('#btnExportJson')?.addEventListener('click', () => {
    if (!state.result) return;
    downloadText('reflex-simulation.json', JSON.stringify(state.result, null, 2), 'application/json');
    showToast('Downloaded simulation JSON');
  });

  // 11. Share Scenario
  $('#btnShareScenarioTop')?.addEventListener('click', shareScenario);

  // 12. Heatmap Interactivity
  const heatmapEl = $('#stabilityHeatmapCanvas');
  if (heatmapEl) {
    heatmapEl.addEventListener('mousemove', heatmapHover);
    heatmapEl.addEventListener('mouseleave', () => {
      const tip = $('#heatmapTooltip');
      if (tip) tip.style.opacity = '0';
    });
    heatmapEl.addEventListener('click', heatmapClick);
  }

  // 13. Window Resize
  window.addEventListener('resize', () => {
    if (state.sweep) drawHeatmap();
    if (state.result) drawTrajectory(state.result);
  }, { passive: true });

  // 14. Initial Run
  runSimulation();
}

// Start application — use 'load' so layout & fonts are complete before canvas draws
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init, { once: true });
}
