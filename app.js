import { simulate, MODEL_DEFAULTS } from './lib/model.js';
import { stabilitySweep } from './lib/sweep.js';
import { resultToCsv, downloadText } from './lib/export.js';
import { sourceRegistry } from './lib/mechanism.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  config: { ...MODEL_DEFAULTS },
  result: null,
  sweep: null,
};

const formatPct = (v, digits = 1) => `${(v * 100).toFixed(digits)}%`;
const formatNum = (v, digits = 2) => Number(v).toFixed(digits);

function readControls() {
  state.config = {
    ...MODEL_DEFAULTS,
    initialShock: Number($('#initialShock').value) / 100,
    contagionStrength: Number($('#contagion').value),
    feeDeterrence: Number($('#deterrence').value),
    feeFloor: Number($('#feeFloor').value) / 100,
    feeCeiling: Number($('#feeCeiling').value) / 100,
    feeSaturation: Number($('#saturation').value) / 100,
    horizon: Number($('#horizon').value),
  };
}

function syncControlLabels() {
  $('#initialShockValue').textContent = `${$('#initialShock').value}%`;
  $('#contagionValue').textContent = Number($('#contagion').value).toFixed(1);
  $('#deterrenceValue').textContent = Number($('#deterrence').value).toFixed(1);
  $('#feeFloorValue').textContent = `${$('#feeFloor').value}%`;
  $('#feeCeilingValue').textContent = `${$('#feeCeiling').value}%`;
  $('#saturationValue').textContent = `${$('#saturation').value}%`;
  $('#horizonValue').textContent = `${$('#horizon').value} rounds`;
}

function classificationCopy(classification) {
  if (classification === 'stable') return ['STABLE', 'Exit activity converges under these assumptions.'];
  if (classification === 'cascade') return ['CASCADE', 'The model enters a self-reinforcing exit regime under these assumptions.'];
  return ['BORDERLINE', 'The path stays unresolved within the selected horizon.'];
}

function updateMetrics(result) {
  const last = result.rounds.at(-1);
  const [label, sub] = classificationCopy(result.classification);
  $('#classification').textContent = label;
  $('#classificationSub').textContent = sub;
  $('#classificationCard').dataset.state = result.classification;
  $('#classificationReason').textContent = result.classificationReason;

  $('#metricPressure').textContent = formatPct(last.pressureAfter);
  $('#metricFee').textContent = formatPct(last.feeAfter);
  $('#metricRemaining').textContent = Math.round(last.participantsRemaining).toLocaleString();
  $('#metricExited').textContent = formatPct(result.cumulativeExitedShare);
  $('#metricBurn').textContent = formatPct(result.totalBurnShare, 2);
  $('#metricRedistribution').textContent = formatPct(result.totalRedistributionShare, 2);
}

function linePath(values, width, height, maxY = 1) {
  if (!values.length) return '';
  const padX = 8;
  const usableW = width - padX * 2;
  const usableH = height - 16;
  return values.map((v, i) => {
    const x = padX + (values.length === 1 ? 0 : (i / (values.length - 1)) * usableW);
    const y = 8 + usableH - (Math.min(maxY, Math.max(0, v)) / maxY) * usableH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

function drawTrajectory(result) {
  const svg = $('#trajectorySvg');
  const box = svg.viewBox.baseVal;
  const width = box.width || 900;
  const height = box.height || 330;
  const exit = result.rounds.map((r) => r.exitRate);
  const fee = result.rounds.map((r) => r.feeAfter);
  const pressure = result.rounds.map((r) => r.pressureAfter);
  const maxY = Math.max(0.15, ...exit, ...fee, ...pressure) * 1.12;

  svg.innerHTML = '';
  for (let i = 0; i <= 4; i += 1) {
    const y = 10 + ((height - 28) * i / 4);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '8'); line.setAttribute('x2', String(width - 8));
    line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
    line.setAttribute('class', 'chart-grid');
    svg.appendChild(line);
  }

  const series = [
    ['exit-line', exit],
    ['fee-line', fee],
    ['pressure-line', pressure],
  ];
  for (const [klass, values] of series) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', linePath(values, width, height, maxY));
    p.setAttribute('class', `chart-path ${klass}`);
    svg.appendChild(p);
  }

  $('#chartScale').textContent = `0 → ${(maxY * 100).toFixed(0)}%`;
}

function updateTrace(result) {
  const tbody = $('#traceBody');
  tbody.innerHTML = result.rounds.map((r) => `
    <tr>
      <td>${r.round + 1}</td>
      <td>${formatPct(r.exitRate, 2)}</td>
      <td>${formatPct(r.pressureAfter, 2)}</td>
      <td>${formatPct(r.feeAfter, 2)}</td>
      <td>${Math.round(r.participantsRemaining).toLocaleString()}</td>
      <td>${r.behavioralScore == null ? 'shock' : formatNum(r.behavioralScore, 3)}</td>
    </tr>`).join('');
}

function drawMechanismTrace(result) {
  const r = result.rounds[Math.min(1, result.rounds.length - 1)];
  $('#traceExit').textContent = formatPct(r.exitRate, 1);
  $('#tracePressure').textContent = formatPct(r.pressureAfter, 1);
  $('#traceFee').textContent = formatPct(r.feeAfter, 1);
  $('#traceResponse').textContent = r.behavioralScore == null ? 'exogenous' : formatNum(r.behavioralScore, 2);
}

function heatColor(classification) {
  const style = getComputedStyle(document.documentElement);
  if (classification === 'stable') return style.getPropertyValue('--stable').trim() || '#4ade80';
  if (classification === 'cascade') return style.getPropertyValue('--cascade').trim() || '#f87171';
  return style.getPropertyValue('--borderline').trim() || '#fbbf24';
}

function drawHeatmap() {
  const canvas = $('#heatmap');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rect.width, H = rect.height;

  const sweep = state.sweep;
  const cols = sweep.xValues.length;
  const rows = sweep.yValues.length;
  const cw = W / cols, ch = H / rows;
  ctx.clearRect(0, 0, W, H);

  for (const cell of sweep.cells) {
    ctx.fillStyle = heatColor(cell.classification);
    ctx.globalAlpha = 0.82;
    const x = cell.xi * cw;
    const y = H - (cell.yi + 1) * ch;
    ctx.fillRect(x, y, Math.ceil(cw + 0.2), Math.ceil(ch + 0.2));
  }
  ctx.globalAlpha = 1;
}

function buildSweep() {
  state.sweep = stabilitySweep(state.config, {
    xMin: 0, xMax: 30, xSteps: 31,
    yMin: 0, yMax: 20, ySteps: 21,
  });
  drawHeatmap();
}

function heatmapHover(event) {
  if (!state.sweep) return;
  const canvas = $('#heatmap');
  const rect = canvas.getBoundingClientRect();
  const xNorm = (event.clientX - rect.left) / rect.width;
  const yNorm = 1 - (event.clientY - rect.top) / rect.height;
  const xi = Math.max(0, Math.min(state.sweep.xValues.length - 1, Math.floor(xNorm * state.sweep.xValues.length)));
  const yi = Math.max(0, Math.min(state.sweep.yValues.length - 1, Math.floor(yNorm * state.sweep.yValues.length)));
  const cell = state.sweep.cells.find((c) => c.xi === xi && c.yi === yi);
  if (!cell) return;
  const tip = $('#heatTip');
  tip.innerHTML = `<strong>${cell.classification.toUpperCase()}</strong><span>Contagion ${cell.contagionStrength.toFixed(1)} · Fee deterrence ${cell.feeDeterrence.toFixed(1)} · ${(cell.cumulativeExitedShare * 100).toFixed(1)}% cumulative exits</span>`;
  tip.style.opacity = '1';
}

function renderSources() {
  const list = $('#sourceList');
  list.innerHTML = Object.values(sourceRegistry).map((item) => `
    <article class="source-row">
      <div><span class="status-badge ${item.status}">${item.status.replaceAll('-', ' ')}</span></div>
      <div>
        <h4>${item.label}</h4>
        <p>${item.note}</p>
        ${item.source ? `<a href="${item.source}" target="_blank" rel="noreferrer">Open source ↗</a>` : ''}
      </div>
    </article>`).join('');
}

function run() {
  readControls();
  state.result = simulate(state.config);
  updateMetrics(state.result);
  drawTrajectory(state.result);
  updateTrace(state.result);
  drawMechanismTrace(state.result);
  buildSweep();
}

function preset(name) {
  const presets = {
    baseline: { initialShock: 10, contagion: 18, deterrence: 8, feeFloor: 2, feeCeiling: 40, saturation: 50 },
    contagion: { initialShock: 12, contagion: 24, deterrence: 4, feeFloor: 2, feeCeiling: 40, saturation: 50 },
    deterrence: { initialShock: 12, contagion: 16, deterrence: 14, feeFloor: 2, feeCeiling: 40, saturation: 50 },
  };
  const p = presets[name];
  $('#initialShock').value = p.initialShock;
  $('#contagion').value = p.contagion;
  $('#deterrence').value = p.deterrence;
  $('#feeFloor').value = p.feeFloor;
  $('#feeCeiling').value = p.feeCeiling;
  $('#saturation').value = p.saturation;
  syncControlLabels();
  run();
}

$$('input[type="range"]').forEach((el) => el.addEventListener('input', () => {
  syncControlLabels();
  run();
}));

$$('[data-preset]').forEach((btn) => btn.addEventListener('click', () => preset(btn.dataset.preset)));

$('#downloadCsv').addEventListener('click', () => {
  downloadText('reflex-simulation.csv', resultToCsv(state.result), 'text/csv');
});

$('#downloadJson').addEventListener('click', () => {
  downloadText('reflex-simulation.json', JSON.stringify(state.result, null, 2), 'application/json');
});

$('#heatmap').addEventListener('mousemove', heatmapHover);
$('#heatmap').addEventListener('mouseleave', () => { $('#heatTip').style.opacity = '0'; });
window.addEventListener('resize', () => { if (state.sweep) drawHeatmap(); });

renderSources();
syncControlLabels();
run();
