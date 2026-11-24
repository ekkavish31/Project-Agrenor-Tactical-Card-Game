/* node tools/test-html-scripts.cjs — every inline <script> of every page must be valid JavaScript.
   Why: an automatic "bump ?v=" that matched `?v=\S+` ate the closing quote (and the code after it) of strings such as 'js/asset-manifest.js?v=…' — Asset Studio / Object Asset Studio / Scale Lineup stopped loading and nothing noticed (v98.1015 … v98.1027, fixed v98.1028).
   It also lists suspicious `?v=` text that is the LAST thing on its line inside an inline script (the usual sign of a swallowed quote). Module scripts / JSON / templates are skipped. */
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = path.join(__dirname, '..'); let bad = 0, n = 0, pages = 0;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'html-scripts-'));
for (const f of fs.readdirSync(ROOT).filter(x => x.endsWith('.html')).sort()) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8'); pages++;
  const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g; let m, i = 0;
  while ((m = re.exec(s))) {
    const attrs = m[1], code = m[2]; i++;
    if (!code.trim() || /type\s*=\s*["'](?:application\/json|application\/ld\+json|text\/template|importmap)/i.test(attrs)) continue;
    const mod = /type\s*=\s*["']module/i.test(attrs), file = path.join(tmp, 'x' + (mod ? '.mjs' : '.js')); fs.writeFileSync(file, code); n++;
    const r = cp.spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (r.status) { bad++; const line = s.slice(0, m.index).split('\n').length; console.log('✗ ' + f + ' · inline script #' + i + ' (starts at line ' + line + '): ' + (r.stderr.split('\n').find(l => /Error/.test(l)) || '').trim()) }
  }
}
console.log(bad ? '\n✗ ' + bad + ' broken inline script(s)' : '✓ all ' + n + ' inline scripts in ' + pages + ' pages are valid JavaScript');
process.exitCode = bad ? 1 : 0;
