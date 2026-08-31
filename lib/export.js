export function resultToCsv(result) {
  const headers = [
    'round','exit_rate','exit_pressure','resolution_fee','remaining_participants','cumulative_exited','burn_share','redistribution_share','behavioral_score'
  ];
  const rows = result.rounds.map((r) => [
    r.round,
    r.exitRate,
    r.pressureAfter,
    r.feeAfter,
    r.participantsRemaining,
    r.cumulativeExitedShare,
    r.burnShare,
    r.redistributionShare,
    r.behavioralScore ?? '',
  ]);
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
