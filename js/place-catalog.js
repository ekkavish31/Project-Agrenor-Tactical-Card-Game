/* v98.526 · รายการ "แผนที่ย่อย" ทั้งหมด แบ่งหมวดตามเมืองที่แมพนั้นอยู่ (ใช้ใน dropdown ของตัวแก้แมพย่อย js/place-build.js)
   • เฟิร์นเวล = ทุกสถานที่ในหมู่บ้านที่ห้องภายในมีอยู่ในเกมแล้ว (INTERIOR · js/interior.js) — ตรงกับ scale-lineup.html
   • เมืองอื่นทั้งโลก (ชื่อเมืองจาก js/world-gen.js TOWNS · สถานที่จาก js/town-services.js SVC) = แมพ "ลานกลางเมือง" + สถานที่ที่เกมมีบริการอยู่จริง
     ถ้าเมืองไหนยังไม่มีสถานที่ที่เกมระบุ จะมีแค่ลานกลางเมือง (ไม่แต่งชื่อสถานที่เพิ่มเอง) · เพิ่มสถานที่ได้ที่ ＋ สถานที่ใหม่
   • "นอกเมือง" = จุดสำคัญบนแผนที่โลกที่มีชื่อแล้ว (เหมืองลึก · ซากสำนัก)
   รายการที่ยังไม่มีแมพ → เลือกแล้วระบบสร้างห้องว่างให้ (แม่แบบเดียวกับ ＋ สถานที่ใหม่) เก็บ town ไว้ในแมพ
   ใช้: PlaceCatalog.{TOWNS, groups(all, hidden, current), template(name, town)} */
(function (root) {
  'use strict';
  const BUILTIN = { market: 'ตลาด', forge: 'โรงตีเหล็ก', home: 'บ้านของเรา' };
  const FERNVALE = [
    ['inn', 'โรงแรมเขากวางทอง'], ['healer', 'บ้านหมอยา'], ['shop', 'ร้านค้า'], ['market', 'ตลาด'], ['temple', 'วิหาร'], ['forge', 'โรงตีเหล็ก'], ['farm', 'ไร่'],
    ['guild', 'สมาคมนักผจญภัย'], ['square', 'ลานน้ำพุ'], ['home', 'บ้านของเรา'],
    ['npc0', 'บ้านป้าเมย์'], ['npc1', 'บ้านลุงทอม'], ['npc2', 'บ้านคุณยายลิน'], ['npc3', 'บ้านพี่น้องคนตัดไม้'], ['npc4', 'บ้านนายพรานเบิร์ก'], ['npc5', 'บ้านคุณครูมิรา'],
    ['npc6', 'บ้านชาวประมงโจ'], ['npc7', 'บ้านคนเลี้ยงแกะ'], ['npc8', 'บ้านช่างทอผ้าเอลลา'], ['npc9', 'บ้านหมอยาสมุนไพร'], ['npc10', 'บ้านผู้ใหญ่บ้านโอเรน'],
    ['npc11', 'บ้านช่างตีเหล็กกัส'], ['npc12', 'บ้านยามดอร์ก'], ['npc13', 'บ้านชาวนาฮิลดา'], ['npc14', 'บ้านโม่แป้งของบริน'], ['npc15', 'บ้านเคียร์']
  ];
  /* town id → [place id, name] จาก js/town-services.js SVC (สถานที่ที่เกมมีบริการให้เข้าอยู่แล้ว) */
  const TOWNS = [
    { id: 'fernvale', name: 'หมู่บ้านเฟิร์นเวล', icon: '🏡', places: FERNVALE },
    { id: 'brookmere', name: 'หมู่บ้านบรู๊คเมียร์', icon: '🌾', places: [] },
    { id: 'haven', name: 'ท่าเรือซอลต์เฮเวน', icon: '⚓', places: [] },
    { id: 'northgate', name: 'ด่านหินเหนือ', icon: '🏔', places: [] },
    { id: 'lakenhold', name: 'นครหลวงลาเคนฮอลด์', icon: '🏛', places: [['bounty', 'สำนักใหญ่สมาคม'], ['tower', 'หอคอยเวท'], ['museum', 'พิพิธภัณฑ์'], ['blessing', 'มหาวิหาร'], ['ferry', 'ท่าเรือข้ามฟาก']] },
    { id: 'willowshore', name: 'หมู่บ้านวิลโลว์ชอร์', icon: '⛵', places: [['ferry', 'ท่าเรือข้ามฟาก']] },
    { id: 'deepcairn', name: 'หมู่บ้านดีปแคร์น', icon: '⛏', places: [['mine', 'ปากเหมืองดีปแคร์น']] },
    { id: 'thornwatch', name: 'ธอร์นวอตช์', icon: '🧭', places: [['guide', 'ที่พักพรานนำทาง'], ['tales', 'กองไฟเล่าเรื่อง']] },
    { id: 'vinehollow', name: 'หมู่บ้านไวน์ฮอลโลว์', icon: '♨', places: [['spring', 'บ่อน้ำร้อน']] },
    { id: 'outside', name: 'นอกเมือง · จุดบนแผนที่โลก', icon: '🌍', places: [['deepmine', 'เหมืองลึก (ใกล้ดีปแคร์น)'], ['ruinsite', 'ซากสำนัก (ใกล้ธอร์นวอตช์)']], noSquare: true }
  ];
  const norm = s => String(s || '').replace(/^ภายใน\s*/, '').replace(/\s+/g, '').toLowerCase();
  const same = (a, b) => { a = norm(a); b = norm(b); return !!a && !!b && (a === b || (Math.min(a.length, b.length) >= 5 && (a.includes(b) || b.includes(a)))) };
  const template = (name, town) => ({ name, sub: 'ภายใน ' + name, kind: 'market', town, floor: { w: 11, d: 10, tex: 'paving', walls: false }, exit: { u: 0, v: 9.4 }, stations: [], props: [] });
  const keyFor = (town, id) => 'm-' + town + '-' + id;
  /* all = place-maps-v1 · hidden = project-a-village-hidden-places-v1 · current = key being edited (always kept in the list) → [{id,name,icon,items:[{key,name,exists,town}]}] */
  function groups(all, hidden, current) {
    all = all || {}; hidden = hidden || []; const used = new Set(), out = [];
    const find = (town, pid, name) => {
      if (town === 'fernvale' && BUILTIN[pid] && !hidden.includes('map:' + pid)) return pid;
      const k = keyFor(town, pid); if (all[k]) return k;
      for (const [mk, m] of Object.entries(all)) if (m && !used.has(mk) && !BUILTIN[mk] && (!m.town || m.town === town) && same(m.name, name)) return mk;
      return null;
    };
    for (const T of TOWNS) {
      const items = [];
      const list = T.noSquare ? T.places : [['square', T.id === 'fernvale' ? '' : 'ลานกลางเมือง'], ...T.places].filter(p => p[1] || T.id !== 'fernvale');
      for (const [pid, name] of (T.id === 'fernvale' ? T.places : list)) {
        const existing = find(T.id, pid, name);
        if (existing) used.add(existing);
        items.push({ key: existing || keyFor(T.id, pid), name, exists: !!existing, town: T.id });
      }
      out.push({ id: T.id, name: T.name, icon: T.icon, items });
    }
    /* maps made by hand that match no catalogue entry: kept in their town (m.town) or under เฟิร์นเวล "อื่น ๆ" */
    const extra = { fernvale: [] };
    for (const [mk, m] of Object.entries(all)) { if (!m || used.has(mk) || BUILTIN[mk]) continue; (extra[m.town] || extra.fernvale).push({ key: mk, name: m.name || mk, exists: true, town: m.town || 'fernvale' }); used.add(mk) }
    for (const [t, list] of Object.entries(extra)) { const g = out.find(x => x.id === t) || out[0]; for (const it of list) g.items.push(it) }
    for (const k of Object.keys(BUILTIN)) if (!used.has(k) && !hidden.includes('map:' + k) && !out[0].items.some(i => i.key === k)) out[0].items.push({ key: k, name: BUILTIN[k], exists: true, town: 'fernvale' });
    if (current && !out.some(g => g.items.some(i => i.key === current))) out[0].items.push({ key: current, name: current, exists: true, town: 'fernvale' });
    return out;
  }
  const api = { TOWNS, BUILTIN, groups, template, keyFor };
  root.PlaceCatalog = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
