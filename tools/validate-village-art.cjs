/* Run repository checks (use --all to include the legacy UI suite). Failed tests are re-run against the exact PR base,
   with the same dependencies. A new/different failure fails validation. */
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const root = path.resolve(__dirname, '..'), base = process.env.VALIDATION_BASE;
const all = fs.readdirSync(path.join(root, 'tools')).filter(x => /^test-.*\.cjs$/.test(x)).sort();
const deferred = process.argv.includes('--all') ? [] : all.filter(x => !['test-village-painted-browser.cjs', 'test-npc-event-browser.cjs', 'test-field-edit.cjs'].includes(x) && /require\(['"]playwright['"]\)/.test(fs.readFileSync(path.join(root, 'tools', x), 'utf8')));
const tests = all.filter(x => !deferred.includes(x));
console.log('SEPARATE_UI_CHECKS:' + JSON.stringify(deferred));
const run = (dir, file) => cp.spawnSync(process.execPath, ['tools/' + file], {
  cwd: dir, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024,
  env: { ...process.env, NODE_PATH: path.join(root, 'node_modules') }
});
const signature = r => (r.stdout + '\n' + r.stderr).split('\n').find(s => /^(AssertionError|TypeError:|ReferenceError:|Error:|FAIL |✗ )/.test(s))?.replaceAll(root, '<repo>').replaceAll(base || '<no-base>', '<repo>') || String(r.error?.code || r.status);
let passed = 0, preExisting = [], regressions = [];
for (const file of tests) {
  console.log('::group::tools/' + file); const r = run(root, file); process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || '');
  if (r.status === 0) passed++;
  else {
    const old = base && fs.existsSync(path.join(base, 'tools', file)) ? run(base, file) : null;
    if (old && old.status !== 0 && signature(old) === signature(r)) {
      preExisting.push(file); console.log('BASELINE FAILURE (same at PR base): ' + file + ' — ' + signature(old));
    } else { regressions.push(file); if (old) console.log('BASELINE result: ' + old.status + ' ' + signature(old)); }
  }
  console.log('::endgroup::');
}
const summary = { total: tests.length, passed, preExisting, regressions, deferred };
console.log('VALIDATION_SUMMARY:' + JSON.stringify(summary));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
  '## Repository checks\n\n' + passed + '/' + tests.length + ' passed; ' + preExisting.length + ' fail identically at the PR base; ' + regressions.length + ' regressions.\n\n' +
  (preExisting.length ? 'Existing failures: ' + preExisting.join(', ') + '\n' : '') + (regressions.length ? '\nRegressions: ' + regressions.join(', ') + '\n' : ''));
process.exitCode = regressions.length ? 1 : 0;
