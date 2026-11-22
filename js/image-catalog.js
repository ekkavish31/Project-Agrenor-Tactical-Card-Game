/* v98.533 · ONE place that says what every picture in the repo IS: category (หมวดหมู่) + sub-category, from its path.
   The pictures stay where they are (code, manifest and saves name those paths) — what is unified is the INDEX: data/image-index.js (made by tools/build-image-index.cjs)
   lists every picture file once; Asset Studio → Asset Manager reads it, merges the live repo tree, and files each picture under the category below.
   A new folder that no rule knows falls under "📦 อื่น ๆ" (the test lists them) — add one RULES line to give it a home.
   API: ImageCatalog.{CATS, categoryOf(path) → {cat, sub}, label(cat), order} */
(function (root) {
  'use strict';
  /* id → [icon + Thai name, order] */
  const CATS = {
    portrait: ['🗣 ภาพสนทนา (portrait)', 1], hero: ['🧑‍🎤 ตัวเอก', 2], npc: ['👥 ชาวบ้าน / NPC', 3], ally: ['🤝 เพื่อนร่วมทีม', 4], monster: ['👹 มอนสเตอร์', 5], tactics: ['⚔ ท่าต่อสู้ในสนาม (tactics)', 6],
    card: ['🃏 การ์ด', 7], ui: ['🎛 UI · ไอคอน · เมนู', 8], village: ['🏘 หมู่บ้าน · อาคาร · ของตกแต่ง', 9], interior: ['🏠 ภายในอาคาร', 10], terrain: ['⛰ ภูมิประเทศ · แผนที่โลก', 11], battlefield: ['🌲 ฉากสนามรบ', 12],
    fx: ['✨ เอฟเฟกต์', 13], item: ['🎒 ไอเทม · อาวุธ · พืชผล', 14], story: ['📖 เปิดเรื่อง · อินโทร · ฉาก', 15], lore: ['🗺 แผนที่โลกในเอกสาร (lore)', 16], versions: ['🕘 ประวัติเวอร์ชัน (เก็บไว้ย้อน)', 17], archive: ['🗄 เก็บถาวร · ชั่วคราว · ตัวอย่าง', 18], other: ['📦 อื่น ๆ (ยังไม่มีหมวด)', 19]
  };
  /* first match wins · [regex on the path, category, sub-category (string or fn(match))] */
  const RULES = [
    [/^assets\/generated-village\/portrait-sources\//, 'portrait', 'ต้นฉบับภาพสนทนา NPC (4 อารมณ์)'],
    [/^assets\/generated-village\/(clerk|vera|boss)\.png$/, 'portrait', 'ภาพสนทนาหมู่บ้าน'],
    [/^assets\/generated-village\/vendors\.png$/, 'npc', 'พนักงานร้านและกิลด์ (atlas)'],
    [/^assets\/generated-village\/farmprops\.png$/, 'village', 'ของฟาร์มและไอคอน (atlas)'],
    [/^assets\/generated-village\//, 'story', 'ฉากสนทนาหมู่บ้าน'],
    [/^assets\/cursor\//, 'ui', 'เคอร์เซอร์เกม'],
    [/^assets\/_versions\//, 'versions', 'ประวัติของ slot'],
    [/^assets\/portraits\/story\//, 'portrait', 'ตัวละครเนื้อเรื่อง (4 อารมณ์)'],
    [/^assets\/portraits\//, 'portrait', 'ตัวเอก · ชาวบ้าน'],
    [/^assets\/cards\/portraits\//, 'card', 'ภาพการ์ดยูนิต'],
    [/^assets\/cards\/(elements|event|item|skills|src)\//, 'card', m => 'การ์ด ' + m[1]],
    [/^assets\/cards\//, 'card', 'กรอบ · การ์ดทั่วไป'],
    [/^assets\/characters\/hero/, 'hero', 'ลุคตัวเอก (ชาย/หญิง)'],
    [/^assets\/(hero|adventurer)[^/]*\.webp$/, 'hero', 'ตัวเอก (เดิม)'],
    [/^assets\/tactics\/imported\/[^/]*(hero|mwcast|mw)/, 'hero', 'ท่าตัวเอกที่นำเข้าจากสตูดิโอ'],
    [/^assets\/tactics\/(bram|luna|kier|mil|ren|nadia|sigrid|orla|olwen)[_-]/, 'ally', m => 'ท่าของ ' + m[1]],
    [/^assets\/tactics\/imported\//, 'tactics', 'ท่าที่นำเข้าจากสตูดิโอ (idle/walk/ท่า)'],
    [/^assets\/tactics\//, 'tactics', 'ท่าต่อสู้ · อาวุธในมือ'],
    [/^assets\/allies\//, 'ally', 'ภาพทีม'],
    [/^assets\/village-town\/npc\//, 'npc', 'ชาวบ้านในหมู่บ้าน (ท่ายืน/เดิน)'],
    [/^assets\/village-town\/(buildings|decor|edge|ground)\//, 'village', m => ({ buildings: 'อาคาร', decor: 'ของตกแต่ง', edge: 'ขอบ', ground: 'พื้น' })[m[1]]],
    [/^assets\/village-town\//, 'village', 'ภาพหมู่บ้านอื่น ๆ'],
    [/^assets\/objects\//, 'village', 'วัตถุ · รั้ว · บ้านจาก Workshop'],
    [/^assets\/crops\//, 'item', 'พืชผล'],
    [/^assets\/interior\//, 'interior', 'เฟอร์นิเจอร์ · ของในห้อง'],
    [/^assets\/enemies\//, 'monster', m => /animations/.test(m.input) ? 'แอนิเมชันมอนสเตอร์' : 'มอนสเตอร์ (หน้า/หลัง)'],
    [/^assets\/(terrain|world|v03)\//, 'terrain', m => ({ terrain: 'ภูมิประเทศ (สนามรบ)', world: 'วัตถุบนแผนที่โลก', v03: 'พื้นหลัง · HUD เก่า' })[m[1]]],
    [/^assets\/scenes\//, 'battlefield', 'ฉากพื้นที่'],
    [/^assets\/fx\//, 'fx', m => 'เอฟเฟกต์'],
    [/^assets\/(ui|icons)\//, 'ui', m => m[1] === 'ui' ? 'UI' : 'ไอคอน'],
    [/^assets\/(ui-[^/]*|cursor-[^/]*|favicon[^/]*|water[^/]*)\.(webp|png)$/, 'ui', 'UI / เคอร์เซอร์'],
    [/^assets\/weapons\//, 'item', 'อาวุธ'],
    [/^assets\/(item-|action-|sword|hammer|meal|smelt|sleep|recovery|breath|armor-)[^/]*\.webp$/, 'item', 'ไอเทม · ท่า (ไอคอน)'],
    [/^assets\/(new-game-prologue|intro)\//, 'story', 'เปิดเรื่อง · อินโทร'],
    [/^assets\/[^/]+\.(webp|png|jpg)$/, 'village', 'ไอคอนสถานที่ / เบ็ดเตล็ด (ระดับบนสุดของ assets)'],
    [/^docs\/lore\//, 'lore', 'แผนที่โลกที่เจ้าของวาด'],
    [/^(archive|_archive|dev|tools\/out)\//, 'archive', m => m[1]],
    [/^art-production\//, 'archive', 'art-production (แผ่นสไปรต์ต้นฉบับ)'],
    [/^[^/]+\.(png|webp|jpe?g|gif|svg)$/, 'archive', 'ไฟล์ระดับบนสุดของรีโป'],
  ];
  function categoryOf(p) {
    p = String(p || '').replace(/^\.\//, '');
    for (const [re, cat, sub] of RULES) { const m = re.exec(p); if (m) { m.input = p; return { cat, sub: typeof sub === 'function' ? (sub(m) || '') : sub } } }
    return { cat: 'other', sub: p.split('/').slice(0, 2).join('/') };
  }
  const label = c => (CATS[c] || CATS.other)[0], order = () => Object.keys(CATS).sort((a, b) => CATS[a][1] - CATS[b][1]);
  const api = { CATS, RULES, categoryOf, label, order };
  root.ImageCatalog = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);