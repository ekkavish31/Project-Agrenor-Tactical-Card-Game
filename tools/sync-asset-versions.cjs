/* v98.784 · node tools/sync-asset-versions.cjs [--dry]
   Every page must load a given js/css file with the SAME ?v= (otherwise one page keeps an older cached copy, or loads it twice). Raises each lower ?v= to the highest one used by any page. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..'), dry = process.argv.includes('--dry');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html')), RE = /((?:js|css)\/[\w.-]+\.(?:js|css))\?v=([\w.]+)/g;
const num = s => { const m = String(s).match(/(\d+)\.(\d+)([a-z]?)/); return m ? +m[1] * 1e5 + +m[2] + (m[3] ? .5 : 0) : 0 };
const best = {}; const txt = {};
for (const f of pages) { txt[f] = fs.readFileSync(path.join(root, f), 'utf8'); for (const m of txt[f].matchAll(RE)) if (!best[m[1]] || num(m[2]) > num(best[m[1]])) best[m[1]] = m[2] }
let n = 0;
for (const f of pages) { const t = txt[f].replace(RE, (a, file, v) => { if (v === best[file]) return a; n++; return file + '?v=' + best[file] }); if (t !== txt[f] && !dry) fs.writeFileSync(path.join(root, f), t) }
console.log(n + ' references ' + (dry ? 'would be ' : '') + 'raised');
