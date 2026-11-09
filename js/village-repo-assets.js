/* v98.293 · finds every image asset of the repository and registers it as a placeable kind (split out of js/village-asset-edit.js).
   VillageRepoAssets.init({ KINDS, kind, getG, thumbCache, render }) — getG() returns the CURRENT canvas context (it is swapped while thumbnails render). */
(function () {
 'use strict';
 window.VillageRepoAssets = { init(ctx) {
  const { KINDS, kind, getG, thumbCache, render } = ctx;
 /* ---------- discover all repository image assets for the map picker ---------- */
 const REPO_ASSET_CACHE = 'project-a-village-repo-assets-v1';
 let repoAssetLoadStarted = false;
 function assetGroup(path) {
  const p = path.toLowerCase();
  if (/\b(building|house|inn|guild|shop|market|temple|forge|healer|player-house)\b/.test(p)) return 'อาคารจากคลังเกม';
  if (/\b(tree|bush|flower|grass|plant|nature|forest|leaf|herb)\b/.test(p)) return 'ธรรมชาติจากคลังเกม';
  if (/\b(rock|stone|ore|crystal|mine|mountain)\b/.test(p)) return 'หิน/แร่จากคลังเกม';
  if (/\b(fence|wall|gate|road|path|floor|ground|tile|terrain)\b/.test(p)) return 'พื้น/ทาง/สิ่งก่อสร้าง';
  if (/\b(prop|decor|furniture|bench|barrel|crate|sign|lamp|cart|well|pond|fountain)\b/.test(p)) return 'ของตกแต่งจากคลังเกม';
  return 'Asset เกมอื่นๆ';
 }
 function registerRepoAsset(path) {
  if (!path || !/\.(png|webp|jpe?g)$/i.test(path) || !path.startsWith('assets/')) return;
  // Skip UI art, card faces, and sprite sheets: these are not standalone map objects.
  if (/(^|\/)(ui|icons?|cards?|portraits?|faces|animations?|spritesheets?)(\/|[-_])/i.test(path)) return;
  const id = 'repoasset:' + path;
  if (KINDS[id]) return;
  /* v91.62 · lazy: the image is only requested when it is first drawn (picker thumbnail / placed object) — not for every repo file at startup */
  let file = null;
  const url = 'https://raw.githubusercontent.com/ekkavish31/Project-Agrenor-Tactical-Card-Game/main/' + path.split('/').map(encodeURIComponent).join('/');
  const name = path.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  kind(id, name, assetGroup(path), p => {
   if (!file) { file = new Image(); file.crossOrigin = 'anonymous'; /* v91.82: raw.githubusercontent allows CORS → canvas stays readable so thumbnails can crop to the visible pixels */ file.onload = () => { clearTimeout(window.__repoThumbT); window.__repoThumbT = setTimeout(() => { thumbCache.clear(); if (typeof render === 'function') render(); }, 150); }; file.src = url; return; }
   if (!file.complete || !file.naturalWidth) return;
   const w = 130, h = w * file.naturalHeight / file.naturalWidth;
   getG().drawImage(file, p.x - w / 2, p.y - h, w, h);
  });
 }
 async function loadRepositoryAssets() {
  if (repoAssetLoadStarted) return;
  repoAssetLoadStarted = true;
  try {
   // Cache the discovered paths locally; images themselves remain served by the public repository.
   const saved = JSON.parse(localStorage.getItem(REPO_ASSET_CACHE) || '[]');
   if (Array.isArray(saved) && saved.length) saved.forEach(registerRepoAsset);
   const response = await fetch('https://api.github.com/repos/ekkavish31/Project-Agrenor-Tactical-Card-Game/git/trees/main?recursive=1', { headers: { Accept: 'application/vnd.github+json' } });
   if (!response.ok) throw new Error('GitHub asset list unavailable');
   const tree = await response.json();
   if (!Array.isArray(tree.tree)) throw new Error('Invalid GitHub asset list');
   const paths = tree.tree.filter(x => x.type === 'blob' && x.path.startsWith('assets/') && /\.(png|webp|jpe?g)$/i.test(x.path)).map(x => x.path);
   paths.forEach(registerRepoAsset);
   try { localStorage.setItem(REPO_ASSET_CACHE, JSON.stringify(paths)); } catch (_) {}
   thumbCache.clear();
   if (typeof render === 'function') render();
  } catch (_) {
   // Existing built-in assets and user-uploaded assets remain available offline.
  }
 }
  loadRepositoryAssets();
 } };
})();
