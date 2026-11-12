/* v98.293 · finds every image asset of the repository and registers it as a placeable kind (split out of js/village-asset-edit.js).
   VillageRepoAssets.init({ KINDS, kind, getG, thumbCache, render, decorW }) — getG() returns the CURRENT canvas context (it is swapped while thumbnails render).
   v98.433 · the picker now comes from the LOCAL catalogue js/placeable-art.js (tools/build-placeable-art.cjs): every furniture / workshop /
   town / nature / coast / snow / battlefield / crop picture with a Thai name, a group and a real starting width, loaded from this
   repository's own files (works offline, no GitHub API). Kind id = 'pic:<src>'. Town decoration that already has a 'decor:<name>' kind
   (DECOR_W) is not listed twice.
   The old GitHub discovery ('repoasset:<path>', width 130, foot at the picture bottom) stays ONLY so pieces placed that way keep drawing
   exactly as before: those kinds are registered from the local file and hidden from the picker. A brand-new picture in one of the
   catalogue folders that has no name yet still appears, in group "ภาพใหม่ (ยังไม่ตั้งชื่อ)". */
(function () {
 'use strict';
 window.VillageRepoAssets = { init(ctx) {
  const { KINDS, kind, getG, thumbCache, render } = ctx, decorW = ctx.decorW || {};
  const CAT = window.PLACEABLE_ART || { groups: [], folders: [], items: [] }, known = new Set(CAT.items.map(i => i.src));
  const NEW_GROUP = 'ภาพใหม่ (ยังไม่ตั้งชื่อ)';
  const inFolders = p => (CAT.folders || []).some(f => p.startsWith('assets/' + f + '/') && !p.slice(('assets/' + f + '/').length).includes('/'));
  const dirty = () => { try { terrainDirty = true } catch (e) { } };
  const loaded = id => { thumbCache.delete(id); dirty(); document.dispatchEvent(new CustomEvent('village-kind-ready', { detail: id })) };
  /* a lazily loaded local picture: the first draw requests it */
  const pics = {};
  const pic = (src, id) => { let m = pics[src]; if (!m) { m = pics[src] = new Image(); m.onload = () => loaded(id); m.src = src } return m.complete && m.naturalWidth ? m : null };
  /* ---------- catalogue kinds ---------- */
  for (const it of CAT.items) {
   if (!it.tw) continue;
   const dm = it.src.match(/^assets\/village-town\/decor\/([a-z0-9-]+)\.webp$/); if (dm && decorW[dm[1]]) { const k = KINDS['decor:' + dm[1]]; if (k) k.group = it.g; continue }   /* already a decor: kind → only moved into the same group */
   const id = 'pic:' + it.src;
   kind(id, it.n, it.g, p => {
    const m = pic(it.src, id); if (!m) return;
    const g = getG(), w = it.tw, h = w * m.naturalHeight / m.naturalWidth;
    g.save(); g.fillStyle = '#00000028'; g.beginPath(); g.ellipse(p.x, p.y, w * .36, w * .11, 0, 0, Math.PI * 2); g.fill();
    const rect = [p.x - w / 2, p.y - h * it.ay, w, h];
    if (window.TownArt?.draw) { let near = null; try { near = project(hero.u, hero.v) } catch (e) { } window.TownArt.draw(g, m, null, rect, near) } else g.drawImage(m, ...rect);
    g.restore();
   });
  }
  /* ---------- legacy GitHub kinds (kept drawable, hidden when the catalogue has the picture) ---------- */
  const REPO_ASSET_CACHE = 'project-a-village-repo-assets-v1';
  let repoAssetLoadStarted = false;
  function registerRepoAsset(path) {
   if (!path || !/\.(png|webp|jpe?g)$/i.test(path) || !path.startsWith('assets/')) return;
   if (/(^|\/)(ui|icons?|cards?|portraits?|faces|animations?|spritesheets?)(\/|[-_])/i.test(path)) return;
   const id = 'repoasset:' + path;
   if (KINDS[id]) return;
   const fresh = !known.has(path) && inFolders(path);
   kind(id, fresh ? path.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') : path, fresh ? NEW_GROUP : 'ซ่อน', p => {
    const m = pic(path, id); if (!m) return;
    const w = 130, h = w * m.naturalHeight / m.naturalWidth;
    getG().drawImage(m, p.x - w / 2, p.y - h, w, h);
   });
   if (!fresh) KINDS[id].hidden = true;   /* the picker shows the catalogue's 'pic:' kind instead (or nothing, for frames / textures / UI) */
  }
  /* pieces placed earlier with a repoasset kind that is in the catalogue draw even offline */
  for (const it of CAT.items) registerRepoAsset(it.src);
  async function loadRepositoryAssets() {
   if (repoAssetLoadStarted) return;
   repoAssetLoadStarted = true;
   try {
    const saved = JSON.parse(localStorage.getItem(REPO_ASSET_CACHE) || '[]');
    if (Array.isArray(saved) && saved.length) saved.forEach(registerRepoAsset);
    /* only to notice pictures pushed after this page's catalogue was built — failures change nothing */
    const response = await fetch('https://api.github.com/repos/ekkavish31/Project-Agrenor-Tactical-Card-Game/git/trees/main?recursive=1', { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error('GitHub asset list unavailable');
    const tree = await response.json();
    if (!Array.isArray(tree.tree)) throw new Error('Invalid GitHub asset list');
    const paths = tree.tree.filter(x => x.type === 'blob' && x.path.startsWith('assets/') && /\.(png|webp|jpe?g)$/i.test(x.path)).map(x => x.path);
    paths.forEach(registerRepoAsset);
    try { localStorage.setItem(REPO_ASSET_CACHE, JSON.stringify(paths)) } catch (_) { }
    thumbCache.clear();
    if (typeof render === 'function') render();
   } catch (_) { }
  }
  loadRepositoryAssets();
 } };
})();
