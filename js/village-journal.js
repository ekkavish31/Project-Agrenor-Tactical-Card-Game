/* v95.11 · F4 · village life while the hero is away + the village journal.
   • Leaving for the world map remembers the day; coming back after one day or more rolls up to one event per day away
     (sheep lost · wolves at the fence · Graven's caravan · a fire at Tom's shed · rare herbs in bloom). Each event goes into
     the village memory (js/village-mind.js in the village page) so the villagers talk about it, and some become requests.
   • Requests finish by talking to the person once the condition is met (wins outside the village, wood to bring, or nothing).
   • The journal ("สมุดหมู่บ้าน" in the village toolbar): open requests with hints and progress, news, who is out working, closeness.
   Data: s.village.vj = { from, log:[{day,text}], reqs:[…], last:{type:day} }. Nothing rolls during the intro quests. */
(function (root) {
  'use strict';
  const G = () => (typeof s !== 'undefined' ? s : null), V = () => G()?.village;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const doSave = () => { try { save() } catch (e) { } }, doRender = () => { try { render() } catch (e) { } };
  const toast = (h, k) => root.StoryToast?.(h, k);
  const nm = id => root.VillageLife?.P?.[id]?.name || id;
  const vj = () => { const v = V(); if (!v) return null; v.vj ||= { from: null, log: [], reqs: [], last: {} }; return v.vj };
  const townMind = () => { try { const w = root.VillageTown?.frame?.contentWindow; return /village-town\.html/.test(w.location.pathname) ? w.Mind : null } catch (e) { return null } };

  const EV = {
    sheep: { type: 'village:sheep', who: 'shep', news: 'แกะของปิแอร์หายไปสองตัว',
      req: { title: 'ตามหาแกะของปิแอร์', hint: 'ชนะการต่อสู้นอกหมู่บ้าน 1 ครั้ง (แกะหนีไปทางนั้น) แล้วกลับมาคุยกับปิแอร์คนเลี้ยงแกะ', need: { battles: 1 }, reward: { coins: 40 } } },
    wolves: { type: 'village:wolves', who: 'dork', news: 'หมาป่ามาด้อมรั้วตะวันออกหลายคืน',
      req: { title: 'ไล่หมาป่าให้พ้นรั้ว', hint: 'ชนะการต่อสู้นอกหมู่บ้าน 2 ครั้ง แล้วกลับมารายงานยามดอร์กที่ลานกลางหมู่บ้าน', need: { battles: 2 }, reward: { coins: 50, potion: 1 } } },
    caravan: { type: 'village:caravan', who: 'graven', news: 'คาราวานของเกรเวนมาถึงตลาด ร้านการ์ดมีการ์ดเพิ่ม 1 ใบวันนี้', effect: caravanCard },
    fire: { type: 'village:fire', who: 'tom', news: 'ไฟไหม้โรงไม้ของลุงทอม',
      req: { title: 'ไม้ให้ลุงทอม', hint: 'นำไม้ 3 ท่อนไปให้ลุงทอม (ซื้อไม้ได้ที่ตลาด)', need: { wood: 3 }, reward: { coins: 45 } } },
    herbs: { type: 'village:herbs', who: 'saf', news: 'สมุนไพรหายากออกดอกริมลำธาร หมอยาซาฟทำยาไว้ให้',
      req: { title: 'รับยาจากหมอยาซาฟ', hint: 'แวะคุยกับซาฟที่ร้านยา', need: {}, reward: { potion: 1 } } }
  };
  function caravanCard() { try { const sh = root.CardSources?.offers?.(); if (!sh) return; const T = root.CardSources.TIER, all = Object.values(T).flatMap(t => t.cards), pool = all.filter(k => !sh.list.includes(k) && !((V().cardPool?.[k[0] === 'm' ? 'movement' : 'combat'] || {})[k.slice(2)])); if (pool.length) sh.list.push(pool[Math.floor(Math.random() * pool.length)]) } catch (e) { } }

  /* ---------- the trip: leave → come back ---------- */
  let was = false;
  function poll() {
    const j = vj(); if (!j) return; let w = false; try { w = !!root.VillageTown?.onWorld?.() } catch (e) { }
    if (w && !was && j.from == null) { j.from = G().day; doSave() }
    if (!w && was && j.from != null) { const days = (G().day || 1) - j.from; j.from = null; doSave(); if (days >= 1) roll(days) }
    was = w;
  }
  function roll(days) {
    const j = vj(), st = V().story; if (st && st.mode === 'active') return;   // never during the intro quests
    const happened = [];
    for (let i = 0; i < Math.min(days, 4); i++) {
      if (Math.random() > .6) continue;
      const open = new Set(j.reqs.filter(r => !r.done).map(r => r.key)), keys = Object.keys(EV).filter(k => !open.has(k) && !happened.includes(k) && (G().day - (j.last[k] || -99)) > 3);
      if (!keys.length) break; const k = keys[Math.floor(Math.random() * keys.length)], e = EV[k]; happened.push(k); j.last[k] = G().day;
      j.log.unshift({ day: G().day, text: e.news }); e.effect?.();
      if (e.req) j.reqs.unshift({ key: k, who: e.who, ...e.req, base: V().battles || 0, day: G().day, done: false });
    }
    j.log = j.log.slice(0, 30); j.reqs = j.reqs.slice(0, 12); doSave();
    if (!happened.length) return;
    tellVillage(happened.map(k => ({ type: EV[k].type, who: EV[k].who })), 0);
    showSummary(days, happened, 0);
  }
  function tellVillage(list, tries) { const M = townMind(); if (!M) { if (tries < 25) setTimeout(() => tellVillage(list, tries + 1), 800); return } for (const e of list) try { M.emit(e.type, { who: e.who }) } catch (x) { } }
  function showSummary(days, keys, tries) {
    const busy = root.Cutscene?.isPlaying?.() || document.querySelector('dialog[open],.ck-reveal');
    if (busy || typeof villageDialog !== 'function') { if (tries < 40) setTimeout(() => showSummary(days, keys, tries + 1), 900); return }
    villageDialog('ระหว่างที่เจ้าไม่อยู่ ' + days + ' วัน', `<ul class="vj-list">${keys.map(k => `<li>${esc(EV[k].news)}${EV[k].req ? ` <small>· คำขอ: ${esc(EV[k].req.title)}</small>` : ''}</li>`).join('')}</ul><p class="muted small">ชาวบ้านจะเล่าเรื่องเหล่านี้ให้ฟัง · ดูคำขอทั้งหมดได้ที่ "สมุดหมู่บ้าน"</p><button type="button" class="vj-open">📖 เปิดสมุดหมู่บ้าน</button>`);
    document.querySelector('.vj-open')?.addEventListener('click', () => { try { document.querySelector('dialog[open]')?.close() } catch (e) { } open() });
  }

  /* ---------- requests finish by talking to the person ---------- */
  function progress(r) {
    const v = V(); if (r.need.battles) return { met: (v.battles || 0) - r.base >= r.need.battles, text: `ชนะแล้ว ${Math.min(r.need.battles, (v.battles || 0) - r.base)}/${r.need.battles}` };
    if (r.need.wood) return { met: (v.materials?.wood || 0) >= r.need.wood, text: `มีไม้ ${v.materials?.wood || 0}/${r.need.wood}` };
    return { met: true, text: 'พร้อมแล้ว' };
  }
  function onTalk(id) {
    const j = vj(); if (!j) return;
    for (const r of j.reqs) { if (r.done || r.who !== id) continue; const p = progress(r);
      if (!p.met) { toast('คำขอของ' + esc(nm(id)) + ': ' + esc(r.hint) + ' (' + esc(p.text) + ')'); continue }
      const v = V(); if (r.need.wood) v.materials.wood -= r.need.wood;
      if (r.reward.coins) v.coins = (v.coins || 0) + r.reward.coins;
      if (r.reward.potion) { v.bag ||= {}; v.bag.potion = (v.bag.potion || 0) + r.reward.potion }
      r.done = true; j.log.unshift({ day: G().day, text: 'ช่วย' + nm(id) + 'เรื่อง "' + r.title + '" สำเร็จ' }); doSave(); doRender();
      toast('✓ คำขอสำเร็จ: ' + esc(r.title) + [r.reward.coins ? ' · +' + r.reward.coins + ' 💰' : '', r.reward.potion ? ' · ยา +' + r.reward.potion : ''].join(''), 'good');
      const M = townMind(); if (M) try { M.emit('want:done', { who: id }); M.affect?.(id, 2); M.save?.() } catch (e) { }
    }
  }
  function hookTalk() { const S = root.Story; if (!S?.talked || S.talked.vj) return; const base = S.talked; S.talked = function (id) { try { onTalk(id) } catch (e) { } return base.apply(this, arguments) }; S.talked.vj = true }

  /* ---------- the journal ---------- */
  const JOB = { forage: 'หาของป่า', hunt: 'ล่าสัตว์หาเสบียง', scout: 'สำรวจเส้นทาง', trade: 'นำของไปขายในเมือง' };
  function mindData() { try { return JSON.parse(localStorage.getItem('agrenor-mind-v1') || '{}') } catch (e) { return {} } }
  function open() {
    if (typeof villageDialog !== 'function') return; const j = vj(); if (!j) return;
    const m = mindData(), now = (G().day || 1) * 24 + (G().minutes || 0) / 60;
    const reqs = j.reqs.filter(r => !r.done), done = j.reqs.filter(r => r.done).slice(0, 3);
    const reqHtml = reqs.length ? reqs.map(r => { const p = progress(r); return `<li><b>${esc(r.title)}</b> <small>· ${esc(nm(r.who))}</small><br><span class="muted small">${esc(r.hint)}</span><br><small class="${p.met ? 'vj-ok' : ''}">${esc(p.text)}${p.met ? ' · ไปคุยกับ' + esc(nm(r.who)) + 'ได้เลย' : ''}</small></li>` }).join('') : '<li class="muted">ยังไม่มีคำขอ</li>';
    const doneHtml = done.map(r => `<li class="muted">✓ ${esc(r.title)}</li>`).join('');
    const news = j.log.slice(0, 8).map(n => `<li><small>วันที่ ${n.day}</small> ${esc(n.text)}</li>`).join('') || '<li class="muted">ยังไม่มีข่าว</li>';
    const jobs = Object.entries(m.jobs || {}).map(([id, jb]) => `<li>${esc(nm(id))} · ${esc(JOB[jb.kind] || jb.kind)} · ${jb.back || now >= jb.end ? 'กลับมาแล้ว ไปฟังรายงานได้' : 'กลับในอีก ' + Math.max(1, Math.ceil(jb.end - now)) + ' ชม.'}</li>`).join('') || '<li class="muted">ไม่มีใครออกไปทำงาน</li>';
    const close = Object.entries(m.npc || {}).filter(([id, n]) => n.met && root.VillageLife?.P?.[id]).sort((a, b) => (b[1].aff || 0) - (a[1].aff || 0)).slice(0, 12)
      .map(([id, n]) => { const a = n.aff || 0; return `<li>${esc(nm(id))} <span title="ความสนิท ${a}/10">${a >= 6 ? '💛💛💛' : a >= 3 ? '💛💛' : a >= 1 ? '💛' : a < 0 ? '💔' : '·'}</span></li>` }).join('') || '<li class="muted">ยังไม่รู้จักใครเป็นพิเศษ</li>';
    villageDialog('สมุดบันทึกหมู่บ้าน · วันที่ ' + (G().day || 1), `<div class="vj"><section><h3>คำขอ</h3><ul class="vj-list">${reqHtml}${doneHtml}</ul></section>
      <section><h3>ข่าวในหมู่บ้าน</h3><ul class="vj-list">${news}</ul></section>
      <section><h3>งานที่จ้างไว้</h3><ul class="vj-list">${jobs}</ul></section>
      <section><h3>ความสนิท</h3><ul class="vj-list vj-cols">${close}</ul></section></div>`);
  }

  function boot() { hookTalk(); setInterval(() => { try { poll() } catch (e) { } }, 1000);
    const css = document.createElement('style'); css.textContent = `.vj{display:grid;grid-template-columns:1fr 1fr;gap:12px}.vj h3{margin:4px 0 6px;font-size:15px;color:#ffe2a0}.vj-list{list-style:none;margin:0;padding:0}.vj-list li{padding:5px 0;border-bottom:1px solid #ffffff14}.vj-cols{columns:2}.vj-ok{color:#9fe0a0}.vj-open{margin-top:8px;padding:8px 14px;border-radius:8px;border:1px solid #b6a070;background:#3a2a18;color:#fff0c7;cursor:pointer}@media(max-width:760px){.vj{grid-template-columns:1fr}}`; document.head.appendChild(css) }
  if (document.readyState !== 'loading') setTimeout(boot, 0); else document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
  root.VillageJournal = { open, roll, onTalk, EV };
})(globalThis);
