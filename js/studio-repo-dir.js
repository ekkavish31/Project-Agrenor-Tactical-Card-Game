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
  let bc = null; try { bc = new BroadcastChannel('project-a-staged') } catch (e) {}
  const persist = async () => { await idbSet('repo-staged', [...staged.entries()]); try { bc && bc.postMessage(staged.size) } catch (e) {} };
  /* v98.96 · RECENTLY PUSHED files. After a push the staged list is emptied and the studio re-reads the repo — but the web copy (GitHub Pages / raw) is the OLD one for a few minutes,
     so the work just pushed seemed to vanish, and the next save was built on the old data and pushed over it. A pushed file is now remembered (IndexedDB 'repo-recent', 1 hour)
     and read instead of the web copy until the web copy has the same size (= it caught up). The editor shell (editor.html) writes the same key when IT pushes. */
  const RECENT_TTL = 60 * 60 * 1000, recent = new Map();   // path -> { b: Blob | null (= removed), at }
  async function loadRecent() { recent.clear(); const r = await idbGet('repo-recent'); if (Array.isArray(r)) for (const [p, b, at] of r) if (Date.now() - at < RECENT_TTL) recent.set(p, { b, at }) }
  const persistRecent = () => idbSet('repo-recent', [...recent].map(([p, v]) => [p, v.b, v.at]));
  async function remember(entries) { await loadRecent(); const at = Date.now(); for (const [p, b] of entries) { recent.set(p, { b, at }); try { shaCache.delete(p) } catch (e) { } } await persistRecent() }   /* a push changes main: forget the sha read before it */

  /* v98.130 · the remembered copy must not outlive a NEWER push by someone else (another browser, the editor shell, a commit from Claude):
     it was kept for an hour whenever the web copy had a different size — also when the web copy was different because it was newer — so the studio kept showing
     an old manifest and the next save would have overwritten the newer work. Now the branch's current git blob of that file is asked from GitHub (no Pages delay):
     same as the remembered copy → keep it until the web catches up · different → forget it and read the branch's blob directly. */
  const apiH = () => { const tok = root.GitHubPush?.config?.().token, h = { Accept: 'application/vnd.github+json' }; if (tok) h.Authorization = 'Bearer ' + tok; return h };
  const shaCache = new Map();
  async function freshSha(path) { const c = shaCache.get(path); if (c && Date.now() - c.t < 20000) return c.sha;
    try { const r = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=main', { headers: apiH(), cache: 'no-store' }); if (!r.ok) return null; const j = await r.json(); if (!j || !j.sha) return null; shaCache.set(path, { sha: j.sha, t: Date.now() }); return j.sha } catch (e) { return null } }
  async function gitSha(blob) { const b = new Uint8Array(await blob.arrayBuffer()), h = new TextEncoder().encode('blob ' + b.length + '\0'), all = new Uint8Array(h.length + b.length); all.set(h); all.set(b, h.length);
    const d = await crypto.subtle.digest('SHA-1', all); return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join('') }
  async function apiBlob(sha) { try { const r = await fetch('https://api.github.com/repos/' + REPO + '/git/blobs/' + sha, { headers: { ...apiH(), Accept: 'application/vnd.github.raw' }, cache: 'no-store' }); return r.ok ? await r.blob() : null } catch (e) { return null } }

  /* v98.136 · a staged manifest must not overwrite newer work on main (js/manifest-merge.js). When the first manifest edit is staged, the main manifest it is based on is kept
     (IndexedDB 'repo-staged-base'); on open and right before a push the staged manifest is merged with main's current one. */
  const MANI = ['data/asset-manifest.json', 'js/asset-manifest.js'];
  async function headText(path) { const sha = await freshSha(path); if (sha) { const b = await apiBlob(sha); if (b) return { text: await b.text(), sha } }
    try { const r = await fetch(rel(path), { cache: 'no-cache' }); if (r.ok) return { text: await r.text(), sha: null } } catch (e) { } return null }
  async function recordBase() { const cur = await idbGet('repo-staged-base'); if (cur && cur.text) return; const h = await headText('data/asset-manifest.json'); if (h) await idbSet('repo-staged-base', { text: h.text, sha: h.sha, at: Date.now() }) }
  let lastRebase = null;
  async function rebaseStaged(head) {
    if (!root.ManifestMerge || !MANI.some(p => staged.get(p))) return false;
    const h = head || await headText('data/asset-manifest.json'); if (!h) return false;
    const base = await idbGet('repo-staged-base'), r = await root.ManifestMerge.rebase([...staged], h.text, base && base.text);
    if (!r.changed) return false;
    staged.clear(); for (const [p, b] of r.files) staged.set(p, b); await persist(); await idbSet('repo-staged-base', { text: h.text, sha: h.sha, at: Date.now() });
    lastRebase = { at: Date.now(), note: r.note }; try { root.dispatchEvent(new CustomEvent('repo-rebased', { detail: lastRebase })); root.toast && root.toast('🔀 ' + r.note) } catch (e) { } return true;
  }

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
  const has = p => staged.has(p) ? staged.get(p) !== null : recent.has(p) ? recent.get(p).b !== null : tree.has(p);
  const childrenOf = prefix => {
    const out = new Map();
    const add = p => { if (!p.startsWith(prefix)) return; const rest = p.slice(prefix.length), i = rest.indexOf('/'); if (i < 0) out.set(rest, 'file'); else out.set(rest.slice(0, i), 'directory') };
    tree.forEach(p => { if (!(staged.has(p) && staged.get(p) === null) && !(recent.has(p) && recent.get(p).b === null)) add(p) });
    staged.forEach((v, p) => { if (v) add(p) }); recent.forEach((v, p) => { if (v.b && !staged.has(p)) add(p) });
    return out;
  };

  function fileHandle(path) {
    const name = path.split('/').pop();
    return {
      kind: 'file', name,
      async getFile() {
        const s = staged.get(path);
        if (s) return new File([s], name, { type: s.type });
        const rc = recent.get(path);
        if (rc && rc.b) {
          const fresh = await freshSha(path);
          if (fresh && fresh !== await gitSha(rc.b)) {   /* the branch moved past what this browser pushed: forget the remembered copy, read the branch's own blob */
            recent.delete(path); persistRecent(); const b = await apiBlob(fresh); if (b) return new File([b], name, { type: /\.json$/i.test(path) ? 'application/json' : /\.js$/i.test(path) ? 'text/javascript' : b.type });
          } else {
          try { const r = await fetch(rel(path), { cache: 'no-cache' }); if (r.ok) { const b = await r.blob(); if (b.size === rc.b.size) { recent.delete(path); persistRecent(); return new File([b], name, { type: b.type }) } } } catch (e) {}
          return new File([rc.b], name, { type: rc.b.type });
          }
        }
        for (const u of [rel(path), raw(path)]) { try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) { const b = await r.blob(); return new File([b], name, { type: b.type }) } } catch (e) {} }
        throw nf(path);
      },
      async createWritable() {
        const parts = [];
        return { write: async d => { parts.push(d instanceof Blob || typeof d === 'string' || d instanceof ArrayBuffer || ArrayBuffer.isView(d) ? d : d.data ?? d) }, close: async () => { if (MANI.includes(path) && !staged.get(path)) await recordBase(); staged.set(path, new Blob(parts, { type: /\.json$/i.test(path) ? 'application/json' : /\.js$/i.test(path) ? 'text/javascript' : /\.webp$/i.test(path) ? 'image/webp' : /\.png$/i.test(path) ? 'image/png' : '' })); await persist(); notify() } };
      }
    };
  }
  function dirHandle(prefix) {
    const name = prefix ? prefix.replace(/\/$/, '').split('/').pop() : 'GitHub · main';
    return {
      kind: 'directory', name,
      async queryPermission() { return 'granted' }, async requestPermission() { return 'granted' },
      async getDirectoryHandle(n, o) { const p = prefix + n + '/'; if (!(o && o.create) && ![...tree, ...[...staged].filter(([, v]) => v).map(([k]) => k), ...[...recent].filter(([, v]) => v.b).map(([k]) => k)].some(f => f.startsWith(p))) throw nf(p); return dirHandle(p) },
      async getFileHandle(n, o) { const p = prefix + n; if (!has(p) && !(o && o.create)) throw nf(p); return fileHandle(p) },
      async removeEntry(n) { const p = prefix + n; if (!has(p)) throw nf(p); staged.set(p, null); await persist(); notify() },
      async *entries() { for (const [n, k] of childrenOf(prefix)) yield [n, k === 'file' ? fileHandle(prefix + n) : dirHandle(prefix + n + '/')] },
      async *values() { for await (const [, h] of this.entries()) yield h },
      async *keys() { for await (const [n] of this.entries()) yield n }
    };
  }
  async function open(force) {
    if (!ready || force) ready = (async () => {
      tree = await loadTree(force); await loadRecent();
      if (!staged.size) { const s = await idbGet('repo-staged'); if (Array.isArray(s)) s.forEach(([p, b]) => staged.set(p, b)) }
      try { await rebaseStaged() } catch (e) { console.warn('manifest rebase', e) }
      return dirHandle('')
    })();
    const h = await ready; notify(); return h;
  }
  async function pushStaged(message) {
    const G = root.GitHubPush;
    if (!G) throw Error('ไม่พบระบบ GitHub Push (js/github-push.js)');
    if (!staged.size) return null;
    const tag = await G.commit(message || 'Asset Studio: update images', async head => {
      try { if (head && head.read) { const tx = await head.read('data/asset-manifest.json'); if (tx) await rebaseStaged({ text: tx, sha: null }) } } catch (e) { console.warn('manifest rebase at push', e) }
      const files = [];
      for (const [path, b] of staged) files.push(b ? { path, content: b } : { path, remove: true });
      return files;
    });
    if (tag) { await remember([...staged]); staged.clear(); await persist(); await idbSet('repo-staged-base', null); try { sessionStorage.removeItem(TREE_KEY) } catch (e) {} ready = null; await open(true); notify() }
    return tag;
  }
  /* v98.82 · take back some staged writes (never-pushed drafts that a newer save replaced) — touches nothing that is already in the repo */
  async function drop(paths) { let n = 0; for (const p of paths) if (staged.has(p) && staged.get(p) !== null) { staged.delete(p); n++ } if (n) { await persist(); notify() } return n }
  async function discard() { staged.clear(); await persist(); await idbSet('repo-staged-base', null); notify() }
  /* the editor shell pushed (or dropped) the staged files for us */
  async function afterExternal() { staged.clear(); try { sessionStorage.removeItem(TREE_KEY) } catch (e) {} ready = null; await open(true); notify() }
  root.RepoDir = { open, pushStaged, drop, discard, afterExternal, remember, recentPaths: () => [...recent.keys()], rebaseStaged, lastRebase: () => lastRebase, _gitSha: gitSha, _recentSha: async p => { const v = recent.get(p); return v && v.b ? gitSha(v.b) : null }, count: () => staged.size, paths: () => [...staged.keys()], onChange: f => listeners.push(f) };
})(globalThis);
