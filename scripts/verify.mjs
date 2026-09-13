import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

// Run from the repository root. REFLEX_FORGE may point to a local Foundry binary.
const forge = process.env.REFLEX_FORGE || 'forge';
const directory = 'validation';
mkdirSync(directory, { recursive: true });
const sha256 = data => createHash('sha256').update(data).digest('hex');
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'out', 'cache', 'validation', '.vercel'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(js|mjs|sol|html|css|toml|json)$/.test(path)) files.push(path);
  }
}
walk('.');
const sourceFiles = Object.fromEntries(files.sort().map(path => [path, sha256(readFileSync(path))]));
function run(name, executable, args) {
  const started = new Date().toISOString();
  const result = spawnSync(executable, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const stdout = result.stdout || '';
  const stderr = result.stderr || result.error?.message || '';
  writeFileSync(join(directory, `${name}.stdout`), stdout);
  writeFileSync(join(directory, `${name}.stderr`), stderr);
  return {
    command: [executable === process.execPath ? 'node' : 'forge', ...args],
    startedAt: started, finishedAt: new Date().toISOString(),
    exitCode: result.status, signal: result.signal,
    status: result.status === 0 ? 'PASSED' : result.error ? 'UNAVAILABLE' : 'FAILED',
    stdoutPath: `validation/${name}.stdout`, stderrPath: `validation/${name}.stderr`,
    stdoutSha256: sha256(stdout), stderrSha256: sha256(stderr)
  };
}
const nodeFiles = readdirSync('tests').filter(path => path.endsWith('.test.mjs')).sort().map(path => `tests/${path}`);
const runs = [run('node', process.execPath, ['--test', '--test-reporter=tap', ...nodeFiles]), run('foundry', forge, ['test', '-vvv'])];
const base = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
const version = spawnSync(forge, ['--version'], { encoding: 'utf8' });
const changed = files.filter(path => sha256(readFileSync(path)) !== sourceFiles[path]);
const record = {
  scope: 'Listed REFLEX reference-model tests only; not an official protocol audit or whole-registry proof',
  createdAt: new Date().toISOString(), sourceBaseCommit: base.stdout.trim(),
  sourceIdentity: 'SHA-256 manifest of tested source, including uncommitted changes. The base commit alone does not identify the tested worktree.',
  sourceFiles, sourcesChangedDuringRun: changed,
  nodeVersion: process.version, foundryVersion: version.stdout.trim(), runs,
  status: runs.every(run => run.status === 'PASSED') && changed.length === 0 ? 'PASSED' : 'INCOMPLETE'
};
writeFileSync(join(directory, 'latest.json'), JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ status: record.status, runs: runs.map(({command,status,exitCode}) => ({command,status,exitCode})) }, null, 2));
if (record.status !== 'PASSED') process.exitCode = 1;
