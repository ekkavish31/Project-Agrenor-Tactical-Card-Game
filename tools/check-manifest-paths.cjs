/* node tools/check-manifest-paths.cjs [--fix]
   Every "assets/….png|webp" written in js/asset-manifest.js and data/asset-manifest.json must exist on disk.
   Pictures are converted to .webp when pushed (js/github-push.js), so a manifest that still says .png for a file that is now .webp is the usual drift.
   --fix rewrites those names to the file that exists. Files missing under both names are only reported. Exit 1 when something is wrong (and not fixed). */
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..'), FIX = process.argv.includes('--fix');
let drift = 0, missing = 0;
for (const f of ['js/asset-manifest.js', 'data/asset-manifest.json']) {
  let t = fs.readFileSync(path.join(ROOT, f), 'utf8'), n = 0; const gone = new Set();
  t = t.replace(/"(assets\/[^"?]+\.(png|webp))"/g, (m, s, ext) => {
    if (fs.existsSync(path.join(ROOT, s))) return m;
    const other = s.replace(/\.(png|webp)$/, ext === 'png' ? '.webp' : '.png');
    if (fs.existsSync(path.join(ROOT, other))) { n++; return FIX ? '"' + other + '"' : m }
    gone.add(s); return m;
  });
  drift += n; missing += gone.size;
  if (FIX && n) fs.writeFileSync(path.join(ROOT, f), t);
  console.log(f + ': ' + n + ' wrong extension' + (FIX && n ? ' (fixed)' : '') + ' · ' + gone.size + ' file(s) missing under both names');
}
const bad = (FIX ? 0 : drift); console.log(bad ? '✗ run with --fix' : '✓ no extension drift'); process.exit(bad ? 1 : 0);
