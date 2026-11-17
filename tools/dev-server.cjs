// v98.365 · local dev server with an optional separate assets folder (docs/TODO.md §19)
//   node tools/dev-server.cjs [--port 8080] [--assets /path/to/assets-root]
// Code (html/js/data) is served from this repo; any /assets/** request is looked up FIRST in the assets folder (when given),
// then falls back to the repo's own assets/. The assets folder mirrors the repo layout: <root>/assets/enemies/..., or you may point at the
// `assets` directory itself (both layouts are detected). Same origin → no CORS/canvas problems, nothing in the game code changes.
// Files are never cached (edit an image, press F5). Supports Range requests (video/audio).
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d };
const ROOT = path.join(__dirname, '..'), PORT = +arg('port', process.env.PORT || 8080);
let ASSETS = arg('assets', process.env.ASSET_DIR || ''); if (ASSETS) ASSETS = path.resolve(ASSETS);
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
const isFile = f => { try { return fs.statSync(f).isFile() } catch { return false } };
const inside = (base, f) => f === base || f.startsWith(base + path.sep);
function resolve(url) {
  let p = decodeURIComponent(url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  if (ASSETS && p.startsWith('/assets/')) {
    const rel = p.slice('/assets/'.length);
    for (const f of [path.join(ASSETS, 'assets', rel), path.join(ASSETS, rel)]) if (inside(ASSETS, path.resolve(f)) && isFile(f)) return { f, src: 'local' };
  }
  /* settings the editors save (scale, offsets, manifest, layouts): /data/** and /js/asset-manifest.js are overlaid from <root>/data and <root>/js too */
  if (ASSETS && (p.startsWith('/data/') || p === '/js/asset-manifest.js')) for (const base of [ASSETS, path.dirname(ASSETS)]) { const f = path.join(base, p); if (inside(base, path.resolve(f)) && isFile(f) && (base === ASSETS || path.basename(ASSETS) === 'assets')) return { f, src: 'local' } }
  const f = path.join(ROOT, p); return inside(ROOT, path.resolve(f)) && isFile(f) ? { f, src: 'repo' } : null;
}
const stats = { local: 0, repo: 0, miss: 0 };
http.createServer((q, res) => {
  const r = resolve(q.url); if (!r) { stats.miss++; if (q.url.includes('/assets/')) console.log('404', q.url.split('?')[0]); res.writeHead(404); return res.end('not found') }
  stats[r.src]++; const size = fs.statSync(r.f).size, h = { 'content-type': T[path.extname(r.f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store', 'accept-ranges': 'bytes', 'x-asset-source': r.src };
  const m = /^bytes=(\d*)-(\d*)$/.exec(q.headers.range || '');
  if (m) { let a = m[1] === '' ? size - +m[2] : +m[1], b = m[1] !== '' && m[2] !== '' ? +m[2] : size - 1; b = Math.min(b, size - 1); if (!(a >= 0 && a <= b)) { res.writeHead(416, { 'content-range': 'bytes */' + size }); return res.end() } res.writeHead(206, { ...h, 'content-range': `bytes ${a}-${b}/${size}`, 'content-length': b - a + 1 }); return fs.createReadStream(r.f, { start: a, end: b }).pipe(res) }
  res.writeHead(200, { ...h, 'content-length': size }); fs.createReadStream(r.f).pipe(res);
}).listen(PORT, () => {
  console.log(`Agrenor dev server → http://localhost:${PORT}/index.html`);
  console.log(ASSETS ? `assets: ${ASSETS} (fallback: ${path.join(ROOT, 'assets')})` : 'assets: repo only (pass --assets <folder> to use a separate local folder)');
  if (ASSETS && !fs.existsSync(ASSETS)) console.log('WARNING: assets folder does not exist yet');
});
process.on('SIGINT', () => { console.log('served', JSON.stringify(stats)); process.exit(0) });
