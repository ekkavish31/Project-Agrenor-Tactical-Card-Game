/* v91 · Asset Studio's "game folder", backed by the GitHub repo instead of a folder on this computer.
   RepoDir.open() resolves to an object that behaves like a File System Access directory handle (getDirectoryHandle / getFileHandle /
   entries / removeEntry, createWritable) so the existing Asset Studio code works unchanged:
   · reads come from the repo (same-origin file, falling back to raw.githubusercontent.com) or from a staged copy
   · writes and deletes are STAGED in this browser (IndexedDB) until RepoDir.pushStaged() commits them to GitHub in one commit. */
(function (root) {
  'use strict';
  const REPO = 'ekkavish31/Project-Agrenor-Tactical-Card-Game', TREE_KEY = 'project-a-repo-tree-v1';
  const staged = new Map();           // path -> Blob (write) | null (delete)
  let tree = null, ready = null;      // tree: Set of every file path in the repo
  const listeners = [];
  const notify = () => listeners.forEach(f => { try { f(staged.size) } catch (e) {} });
  const rel = p => p.split('/').map(encodeURIComponent).join('/');
  const raw = p => 'https://raw.githubusercontent.com/' + REPO + '/main/' + rel(p);
  const nf = n => Object.assign(new DOMException('not found: ' + n, 'NotFoundError'));

  function idb() { return new Promise((res, rej) => { const r = indexedDB.open('asset-studio', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) }) }
  async function idbGet(k) { try { const db = await idb(); return await new Promise(r => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(null) }) } catch (e) { return null } }
  async function idbSet(k, v) { try { const db = await idb(); await new Promise(r => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = r; t.onerror = r }) } catch (e) {} }
  const persist = () => idbSet('repo-staged', [...staged.entries()]);

  async function loadTree(force) {
    if (!force) { try { const c = JSON.parse(sessionStorage.getItem(TREE_KEY) || 'null'); if (c && Date.now() - c.t < 6e5) return new Set(c.list) } catch (e) {} }
    let list = null;
    try {
      const tok = root.GitHubPush?.config?.().token, h = { Accept: 'application/vnd.github+json' };
      if (tok) h.Authorization = 'Bearer ' + tok;
      const r = await fetch('https://api.github.com/repos/' + REPO + '/git/trees/main?recursive=1', { headers: h });
      if (!r.ok) throw Error('HTTP ' + r.status);
      list = (await r.json()).tree.filter(x => x.type === 'blob').map(x => x.path);
    } catch (e) {
      // offline / rate limited: fall back to the manifest (images) plus the files Asset Studio itself needs
      const s = new Set(['data/asset-manifest.json', 'js/asset-manifest.js', 'js/animation-data.js', 'js/tactics-sprites.js', 'js/tactics-core.js']);
      const walk = o => { if (!o || typeof o !== 'object') return; for (const v of Object.values(o)) { if (typeof v === 'string' && /^assets\/.+\.(png|webp|jpe?g|gif|svg)$/i.test(v)) s.add(v); else walk(v) } };
      walk(root.ASSET_MANIFEST); list = [...s];
    }
    try { sessionStorage.setItem(TREE_KEY, JSON.stringify({ t: Date.now(), list })) } catch (e) {}
    return new Set(list);
  }
  const has = p => staged.has(p) ? staged.get(p) !== null : tree.has(p);
  const childrenOf = prefix => {
    const out = new Map();
    const add = p => { if (!p.startsWith(prefix)) return; const rest = p.slice(prefix.length), i = rest.indexOf('/'); if (i < 0) out.set(rest, 'file'); else out.set(rest.slice(0, i), 'directory') };
    tree.forEach(p => { if (!(staged.has(p) && staged.get(p) === null)) add(p) });
    staged.forEach((v, p) => { if (v) add(p) });
    return out;
  };

  function fileHandle(path) {
    const name = path.split('/').pop();
    return {
      kind: 'file', name,
      async getFile() {
        const s = staged.get(path);
        if (s) return new File([s], name, { type: s.type });
        for (const u of [rel(path), raw(path)]) { try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) { const b = await r.blob(); return new File([b], name, { type: b.type }) } } catch (e) {} }
        throw nf(path);
      },
      async createWritable() {
        const parts = [];
        return { write: async d => { parts.push(d instanceof Blob || typeof d === 'string' || d instanceof ArrayBuffer || ArrayBuffer.isView(d) ? d : d.data ?? d) }, close: async () => { staged.set(path, new Blob(parts, { type: /\.json$/i.test(path) ? 'application/json' : /\.js$/i.test(path) ? 'text/javascript' : /\.webp$/i.test(path) ? 'image/webp' : /\.png$/i.test(path) ? 'image/png' : '' })); await persist(); notify() } };
      }
    };
  }
  function dirHandle(prefix) {
    const name = prefix ? prefix.replace(/\/$/, '').split('/').pop() : 'GitHub · main';
    return {
      kind: 'directory', name,
      async queryPermission() { return 'granted' }, async requestPermission() { return 'granted' },
      async getDirectoryHandle(n, o) { const p = prefix + n + '/'; if (!(o && o.create) && ![...tree, ...[...staged].filter(([, v]) => v).map(([k]) => k)].some(f => f.startsWith(p))) throw nf(p); return dirHandle(p) },
      async getFileHandle(n, o) { const p = prefix + n; if (!has(p) && !(o && o.create)) throw nf(p); return fileHandle(p) },
      async removeEntry(n) { const p = prefix + n; if (!has(p)) throw nf(p); staged.set(p, null); await persist(); notify() },
      async *entries() { for (const [n, k] of childrenOf(prefix)) yield [n, k === 'file' ? fileHandle(prefix + n) : dirHandle(prefix + n + '/')] },
      async *values() { for await (const [, h] of this.entries()) yield h },
      async *keys() { for await (const [n] of this.entries()) yield n }
    };
  }
  async function open(force) {
    if (!ready || force) ready = (async () => {
      tree = await loadTree(force);
      if (!staged.size) { const s = await idbGet('repo-staged'); if (Array.isArray(s)) s.forEach(([p, b]) => staged.set(p, b)) }
      return dirHandle('')
    })();
    const h = await ready; notify(); return h;
  }
  async function pushStaged(message) {
    const G = root.GitHubPush;
    if (!G) throw Error('ไม่พบระบบ GitHub Push (js/github-push.js)');
    if (!staged.size) return null;
    const tag = await G.commit(message || 'Asset Studio: update images', async () => {
      const files = [];
      for (const [path, b] of staged) files.push(b ? { path, content: b } : { path, remove: true });
      return files;
    });
    if (tag) { staged.clear(); await persist(); try { sessionStorage.removeItem(TREE_KEY) } catch (e) {} ready = null; await open(true); notify() }
    return tag;
  }
  async function discard() { staged.clear(); await persist(); notify() }
  root.RepoDir = { open, pushStaged, discard, count: () => staged.size, paths: () => [...staged.keys()], onChange: f => listeners.push(f) };
})(globalThis);
