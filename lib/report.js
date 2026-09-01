function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function percent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function trajectorySvg(result) {
  const width = 900;
  const height = 300;
  const pad = 34;
  const values = result.rounds.map((round) => round.exitRate);
  const fees = result.rounds.map((round) => round.feeAfter);
  const max = Math.max(0.1, ...values, ...fees) * 1.1;
  const path = (series) => series.map((value, index) => {
    const x = pad + (index / Math.max(1, series.length - 1)) * (width - pad * 2);
    const y = pad + (height - pad * 2) - (value / max) * (height - pad * 2);
    return `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const grid = [0, 1, 2, 3, 4].map((index) => {
    const y = pad + (height - pad * 2) * index / 4;
    return `<line x1="${pad}" x2="${width - pad}" y1="${y}" y2="${y}" stroke="#d8d8d2" stroke-dasharray="4 5"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Exit rate and fee trajectory">${grid}<path d="${path(values)}" fill="none" stroke="#151513" stroke-width="3"/><path d="${path(fees)}" fill="none" stroke="#b82e2b" stroke-width="2.5"/></svg>`;
}

export function generateResearchReport({ result, sensitivity, breakpoints, generatedAt = new Date() }) {
  const config = result.config;
  const influential = sensitivity?.mostInfluential;
  const breakpointRows = (breakpoints?.events || []).map((event) => `
    <tr><td>Round ${event.round}</td><td><strong>${escapeHtml(event.title)}</strong><br>${escapeHtml(event.detail)}</td></tr>
  `).join('');
  const date = generatedAt.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>REFLEX Analysis Report — ${escapeHtml(result.classification.toUpperCase())}</title>
<style>
body{font:15px/1.6 Inter,Arial,sans-serif;color:#171714;background:#f5f5f1;margin:0}.page{max-width:920px;margin:32px auto;background:white;padding:54px;border:1px solid #deded8}.eyebrow{font:700 11px/1.2 monospace;letter-spacing:.12em;text-transform:uppercase;color:#77776f}.head{display:flex;justify-content:space-between;gap:30px;border-bottom:2px solid #171714;padding-bottom:22px}.head h1{font:54px/1 Georgia,serif;margin:8px 0}.verdict{font:800 28px/1 monospace;text-align:right}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0}.metric{border:1px solid #deded8;padding:16px}.metric span{display:block;font:10px monospace;text-transform:uppercase;color:#77776f}.metric strong{font:700 22px monospace}h2{font:32px Georgia,serif;font-weight:400;margin:34px 0 12px}table{width:100%;border-collapse:collapse}td,th{padding:10px 12px;border-bottom:1px solid #e4e4df;text-align:left}th{font:700 10px monospace;text-transform:uppercase;color:#77776f}svg{width:100%;background:#fafaf7;border:1px solid #e4e4df}.legend{font:12px monospace;color:#666}.disclaimer{margin-top:40px;border-top:1px solid #deded8;padding-top:20px;font-size:12px;color:#666}@media print{body{background:white}.page{border:0;margin:0;padding:24px;max-width:none}@page{margin:12mm}}
</style></head><body><main class="page">
<header class="head"><div><div class="eyebrow">Independent mechanism research</div><h1>REFLEX Analysis</h1><p>Generated ${escapeHtml(date)}</p></div><div><div class="eyebrow">Classification</div><div class="verdict">${escapeHtml(result.classification.toUpperCase())}</div></div></header>
<div class="grid"><div class="metric"><span>Cumulative exited</span><strong>${percent(result.cumulativeExitedShare)}</strong></div><div class="metric"><span>Final remaining</span><strong>${percent(result.finalRemainingShare)}</strong></div><div class="metric"><span>Modeled fee burn</span><strong>${percent(result.totalBurnShare, 2)}</strong></div></div>
<h2>Modeled trajectory</h2>${trajectorySvg(result)}<p class="legend">Black — exit rate &nbsp; / &nbsp; Red — resolution fee</p>
<h2>Assumptions used</h2><table><thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>
<tr><td>Initial shock</td><td>${percent(config.initialShock)}</td></tr><tr><td>Contagion strength</td><td>${config.contagionStrength.toFixed(1)}</td></tr><tr><td>Fee deterrence</td><td>${config.feeDeterrence.toFixed(1)}</td></tr><tr><td>Fee floor / ceiling</td><td>${percent(config.feeFloor, 0)} / ${percent(config.feeCeiling, 0)}</td></tr><tr><td>Fee saturation</td><td>${percent(config.feeSaturation, 0)}</td></tr><tr><td>Horizon</td><td>${config.horizon} rounds</td></tr></tbody></table>
<h2>Interpretation</h2><p><strong>${escapeHtml(result.classificationReason)}</strong></p><p>Local sensitivity label: <strong>${escapeHtml(sensitivity?.robustnessLabel || 'not calculated')}</strong>. ${influential ? `${escapeHtml(influential.label)} produced the largest one-at-a-time change in cumulative exits (${percent(influential.impact)}).` : ''}</p>
${breakpointRows ? `<h2>Breakpoint analysis</h2><table><tbody>${breakpointRows}</tbody></table>` : ''}
<p class="disclaimer">REFLEX is an independent sensitivity model. This report describes outputs under explicit research assumptions; it is not a prediction of holder behavior, financial advice, a smart-contract audit, or evidence that the real protocol will succeed or fail.</p>
</main></body></html>`;
}

