/* v98.349 · guard: js/game-version.js must define window.GAME_VERSION (an empty file left every iframe on the fixed ?v=97.17 URL → stale cached pages + old crashing scripts)
   and every page must load the same ?v= of it. Run: node tools/test-version.cjs */
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..'), src = fs.readFileSync(path.join(root, 'js/game-version.js'), 'utf8');
const m = /window\.GAME_VERSION\s*=\s*\{\s*v:\s*'(v[\d.]+)'/.exec(src); assert.ok(m, 'js/game-version.js does not define window.GAME_VERSION');
let n = 0;
for (const f of fs.readdirSync(root).filter(f => f.endsWith('.html'))) {
  const t = fs.readFileSync(path.join(root, f), 'utf8'), tag = /js\/game-version\.js\?v=(v[\d.]+)/.exec(t);
  if (tag) { assert.equal(tag[1], m[1], f + ' loads game-version.js?v=' + tag[1] + ' but the file says ' + m[1]); n++ }
}
console.log('version ' + m[1] + ': ' + n + ' pages agree');
