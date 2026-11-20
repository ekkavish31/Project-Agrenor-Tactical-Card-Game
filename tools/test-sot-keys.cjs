/* v98.881 · every localStorage key the code uses must have a class in js/editor-store.js (sync / layout / manifest / device / save / own).
   An unclassified key = editor data that could stay on one computer without anybody noticing (the single source of truth would leak).
   Run: node tools/test-sot-keys.cjs */
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
const files = [...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f), ...fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))].filter(f => f !== 'js/asset-manifest.js' && f !== 'js/game-settings.js');
const unresolved = new Set(), keys = new Map(), add = (k, f) => { if (!keys.has(k)) keys.set(k, new Set()); keys.get(k).add(f) };
for (const f of files) {
  const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of t.matchAll(/localStorage\??\.(?:getItem|setItem|removeItem)\(\s*(['"`])([^'"`]+)\1/g)) add(m[2], f);
  for (const m of t.matchAll(/\b(?:[A-Z_]*(?:KEY|STORE)[A-Z_0-9]*|SK|MK)\s*=\s*(['"])([a-zA-Z][a-zA-Z0-9._:-]{3,})\1/g)) add(m[2], f);
  /* storage calls through a name: localStorage.setItem(NAME …) / getItem(NAME + …) → the string that NAME is set to in the same file (a "+ …" after it = a prefix key) */
  for (const m of t.matchAll(/localStorage\??\.(?:getItem|setItem|removeItem)\(\s*([A-Za-z_$][\w$]*)(\s*\+)?/g)) {
    const name = m[1]; if (['k', 'key', 'K', 'kk', 'ES'].includes(name)) continue; const esc = name.replace(/\$/g, '\\$'), d = t.match(new RegExp('(?:const|let|var|,)\\s*' + esc + '\\s*=\\s*([\'"])([^\'"]+)\\1')), d2 = !d && t.match(new RegExp('\\b' + esc + '\\s*=\\s*(?:\\w+\\s*=>\\s*)?([\'"])([^\'"]+)\\1\\s*\\+'));
    if (d) add(d[2], f); else if (d2) add(d2[2], f); else unresolved.add(name + ' (' + f + ')');
  }
  for (const m of t.matchAll(/localStorage\??\.(?:getItem|setItem|removeItem)\(\s*(['"])([^'"]+)\1\s*\+/g)) add(m[2], f);
}
/* minimal browser for js/editor-store.js */
const store = new Map(); class Storage { getItem(k) { return store.has(k) ? store.get(k) : null } setItem(k, v) { store.set(String(k), String(v)) } removeItem(k) { store.delete(k) } }
global.Storage = Storage; global.localStorage = new Storage(); global.location = { pathname: '/x' };
global.window = global; require(path.join(ROOT, 'js/editor-store.js'));
global.localStorage = { getItem() { return null }, setItem() { } }; require(path.join(ROOT, 'js/game-settings.js'));
const ES = global.EditorStore, bad = [], by = {};
for (const [k, fs_] of keys) { const c = ES.classify(k); (by[c] ||= []).push(k); if (c === 'unknown') bad.push(k + '  (' + [...fs_].join(', ') + ')') }
for (const [c, l] of Object.entries(by)) console.log(c.padEnd(9), l.length, '·', l.slice(0, 8).join(', ') + (l.length > 8 ? ' …' : ''));
if (unresolved.size) console.log('\n(names whose value could not be read here — checked by hand: ' + [...unresolved].join(', ') + ')');
if (bad.length) { console.log('\n✗ unclassified localStorage keys — add each to SYNC (editor data) or DEVICE / SAVE in js/editor-store.js:\n  ' + bad.join('\n  ')); process.exit(1) }
console.log('\n✓ all ' + keys.size + ' keys classified'); 
