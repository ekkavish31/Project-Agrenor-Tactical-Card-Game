/* v98.784 · node tools/fix-manifest-ext.cjs [--dry]
   js/asset-manifest.js and data/asset-manifest.json sometimes name a picture "x.png" although only "x.webp" exists on disk (the Cart / Studio push converts the file but not every manifest entry).
   Rewrites exactly those names (png missing AND webp present) — nothing else is touched. */
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..'), dry = process.argv.includes('--dry');
let total = 0;
for (const f of ['js/asset-manifest.js', 'data/asset-manifest.json']) {
  const p = path.join(ROOT, f); let n = 0;
  const t = fs.readFileSync(p, 'utf8').replace(/assets\/[^"'\\\s]+?\.png\b/g, m => { if (fs.existsSync(path.join(ROOT, m)) || !fs.existsSync(path.join(ROOT, m.replace(/\.png$/, '.webp')))) return m; n++; return m.replace(/\.png$/, '.webp') });
  if (n && !dry) fs.writeFileSync(p, t); console.log(f + ': ' + n + ' names ' + (dry ? 'would change' : 'fixed')); total += n;
}
process.exit(0);
