/* v93.03 · Village mind: what the people of Fernvale know, remember and want.
   One event bus for the whole game (world map, battles, inn, village) → events live for a few days, then are forgotten.
   Each villager learns an event when they saw it, when it is about them, or later through gossip (bigger news and chattier people = sooner).
   Talking picks the most pressing thing they have not told you yet (a job report, a favour you finished, fresh news, a request, a first meeting),
   otherwise small talk — composed from opener + line + closer by personality voice, never repeating recent lines.
   Also: scenes between villagers who share a room, jobs (send someone out to work), wants (small favours with rewards), relationships.
   Save 'agrenor-mind-v1' is versioned and migrated; anything unknown is dropped instead of breaking the game.
   Content lives in js/village-lines.js; this file is logic only and runs in node for tests (tools/test-village-mind.cjs). */
(function (root) {
  'use strict';
  const KEY = 'agrenor-mind-v1', VERSION = 1, MAX_EVENTS = 120, NPC_RECENT = 15, GLOBAL_RECENT = 30;

  function create(opt = {}) {
    const LN = opt.lines || root.VillageLines;
    const people = () => opt.people || root.VillageLife?.P || {};
    const rng = opt.rng || Math.random;
    const store = opt.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    const clock = opt.clock || (() => { const c = root.VillageClock?.read(); return c ? c.day * 24 + c.hour : 0 });
    const heroName = opt.heroName || (() => { try { return JSON.parse(store?.getItem('project-a-save') || '{}')?.heroName || 'นักผจญภัย' } catch (e) { return 'นักผจญภัย' } });
    const pick = a => a[Math.floor(rng() * a.length)];
    let M = null;

    /* ---------- save + migration ---------- */
    function blank() { return { v: VERSION, seq: 0, events: [], npc: {}, rel: {}, scenes: {}, jobs: {}, wants: {}, recent: [], counts: {} } }
    function migrate(m) {
      if (!m || typeof m !== 'object') return blank();
      if (!m.v) m = { ...blank(), events: Array.isArray(m.events) ? m.events : [] };   // v0 (pre-release) → v1
      const b = blank(); for (const k in b) if (m[k] == null || typeof m[k] !== typeof b[k] || Array.isArray(m[k]) !== Array.isArray(b[k])) m[k] = b[k];
      m.events = m.events.filter(e => e && typeof e.type === 'string' && typeof e.t === 'number' && LN.EVENTS[e.type]);
      m.v = VERSION; return m;
    }
    function load() { if (M) return M; let raw = null; try { raw = JSON.parse(store?.getItem(KEY) || 'null') } catch (e) { } M = migrate(raw); return M }
    function save() { try { store?.setItem(KEY, JSON.stringify(M)) } catch (e) { } }
    function reload() { M = null; return load() }
    const npc = id => { const m = load(); const n = (m.npc[id] ||= {}); n.said ||= {}; n.recent ||= []; n.aff ??= 0; n.flags ||= {}; return n };

    /* ---------- events ---------- */
    function emit(type, data = {}) {
      const m = load(), def = LN.EVENTS[type]; if (!def) return null;
      const e = { id: ++m.seq, type, t: data.t ?? clock(), ...data }; delete e.witness; if (data.witness) e.seen = [].concat(data.witness);
      m.events.push(e); m.counts[type] = (m.counts[type] || 0) + 1;
      if (e.biome) m.counts[type + '@' + e.biome] = (m.counts[type + '@' + e.biome] || 0) + 1;
      if (e.dest) m.counts[type + '@' + e.dest] = (m.counts[type + '@' + e.dest] || 0) + 1;
      prune(); save(); return e;
    }
    function prune() {
      const m = load(), now = clock();
      m.events = m.events.filter(e => now - e.t <= (LN.EVENTS[e.type]?.life || 2) * 24);
      if (m.events.length > MAX_EVENTS) m.events = m.events.slice(-MAX_EVENTS);
      const live = new Set(m.events.map(e => String(e.id)));
      for (const n of Object.values(m.npc)) for (const k in n.said || {}) if (!live.has(k)) delete n.said[k];
    }
    /* hours until a villager hears of it: big news travels fast, chatty people hear first */
    function delay(e, p) { const sal = LN.EVENTS[e.type]?.sal ?? 1, gos = p?.gossip ?? 1; return Math.max(0, (6 - sal) * (4 - gos) * 1.5) }
    function knows(id, e, now = clock()) {
      if (e.who === id || e.seen?.includes(id)) return true;
      return now >= e.t + delay(e, people()[id]);
    }
    const known = (id, now = clock()) => load().events.filter(e => knows(id, e, now));

    /* ---------- text ---------- */
    function fillSlots(txt, e = {}, self) {
      const P = people(), nm = id => P[id]?.name || id;
      return String(txt)
        .replace(/\{self\}/g, self ? nm(self) : '').replace(/\{role\}/g, self ? P[self]?.role || '' : '').replace(/\{name\}/g, heroName())
        .replace(/\{dest\}/g, e.destName || 'ที่นั่น').replace(/\{foe\}/g, LN.FOE[e.foe] || e.foeName || 'ศัตรู').replace(/\{biome\}/g, LN.BIOME[e.biome] || 'นอกหมู่บ้าน')
        .replace(/\{who\}/g, e.who ? nm(e.who) : (e.whoName || 'เพื่อนร่วมทาง')).replace(/\{other\}/g, e.who ? nm(e.who) : 'ใครบางคน')
        .replace(/\{days\}/g, e.days ?? 'หลาย').replace(/\{gold\}/g, e.gold ?? '').replace(/\{job\}/g, e.jobName || 'งาน').replace(/\{result\}/g, e.result || 'เรียบร้อยดี');
    }
    /* choose a line nobody said recently (this person: last 15, anyone: last 30); falls back to the least recent */
    function fresh(id, list) {
      if (!list?.length) return null;
      const n = npc(id), g = load().recent, ok = list.filter(x => !n.recent.includes(x) && !g.includes(x));
      if (ok.length) return pick(ok);
      const mine = list.filter(x => !n.recent.includes(x)); if (mine.length) return pick(mine);
      return list.slice().sort((a, b) => n.recent.indexOf(a) - n.recent.indexOf(b))[0];
    }
    function remember(id, core) {
      const n = npc(id), m = load();
      n.recent = [...n.recent.filter(x => x !== core), core].slice(-NPC_RECENT);
      m.recent = [...m.recent.filter(x => x !== core), core].slice(-GLOBAL_RECENT);
    }
    const voiceOf = id => LN.V[people()[id]?.voice] || LN.V.warm;
    function compose(id, core, e, { open = .5, close = .35 } = {}) {
      const v = voiceOf(id), n = npc(id);
      const o = rng() < open ? fresh(id, v.open) : '', c = rng() < close ? fresh(id, v.close.filter(Boolean)) : '';
      const parts = [o, core, c].filter(Boolean).map(s => fillSlots(s, e, id));
      remember(id, core); if (o) n.recent.push(o); if (c) n.recent.push(c); n.recent = n.recent.slice(-NPC_RECENT);
      return parts.join(' ').replace(/\s+/g, ' ').trim();
    }
    function reactLines(id, e) {
      const per = LN.PERSONAL[id] || {}, keys = [e.type + '@' + e.dest, e.type + '@' + e.biome, e.type];
      for (const k of keys) if (per[k]?.length) return { list: per[k], personal: true };
      if (e.who && e.who !== id && LN.GOSSIP[e.type] && rng() < .4) return { list: LN.GOSSIP[e.type], personal: false };
      return { list: voiceOf(id).react[e.type] || [], personal: false };
    }

    /* ---------- wants ---------- */
    const wantKey = c => c.count || (c.ev + (c.dest ? '@' + c.dest : c.biome ? '@' + c.biome : ''));
    function wantMet(id, w) {
      const m = load(), c = w.cond;
      if (c.aff != null) return npc(id).aff >= c.aff;
      return (m.counts[wantKey(c)] || 0) - (m.wants[id]?.base || 0) >= (c.n || 1);
    }
    function wantState(id) { const w = LN.WANTS[id]; if (!w) return null; const s = load().wants[id]; return { def: w, asked: !!s, done: !!s?.done, met: !!s && !s.done && wantMet(id, w) } }
    function askWant(id) { const m = load(), w = LN.WANTS[id]; if (!w || m.wants[id]) return; m.wants[id] = { at: clock(), base: w.cond.dest || w.cond.aff != null ? 0 : m.counts[wantKey(w.cond)] || 0 } }
    function finishWant(id, S) {
      const m = load(), w = LN.WANTS[id]; m.wants[id].done = clock();
      if (S) { S.gold = (S.gold || 0) + (w.reward.gold || 0); S.potions = (S.potions || 0) + (w.reward.potions || 0) }
      affect(id, 2); emit('want:done', { who: id, witness: [id] }); return w.reward;
    }

    /* ---------- jobs ---------- */
    const away = (id, now = clock()) => { const j = load().jobs[id]; return !!j && !j.back && now < j.end };
    function canWork(id, benched) { return (LN.WORKERS[id] || (benched ? Object.keys(LN.JOBS) : [])).filter(k => LN.JOBS[k]) }
    function startJob(id, kind, S) {
      const J = LN.JOBS[kind], m = load(); if (!J || m.jobs[id] && !m.jobs[id].back) return { ok: false, why: 'busy' };
      if (S && (S.gold || 0) < J.cost) return { ok: false, why: 'gold' };
      if (S) S.gold -= J.cost;
      m.jobs[id] = { kind, start: clock(), end: clock() + J.hours, story: Math.floor(rng() * J.stories.length) }; save(); return { ok: true, job: m.jobs[id] };
    }
    /* finish jobs whose time is up: give the reward into the world save S and tell the village */
    function tick(S) {
      const m = load(), now = clock(), out = [];
      for (const [id, j] of Object.entries(m.jobs)) {
        if (j.back || now < j.end) continue;
        const J = LN.JOBS[j.kind]; if (!J) { delete m.jobs[id]; continue }
        const hurt = rng() < .15, story = J.stories[j.story] || pick(J.stories);
        let gain = '';
        if (J.give === 'potions') { const n = hurt ? 1 : 2; if (S) S.potions = (S.potions || 0) + n; gain = `ยาฟื้นฟู +${n}` }
        else if (J.give === 'food') { const n = hurt ? 3 : 6; if (S) S.food = (S.food || 0) + n; gain = `เสบียง +${n}` }
        else if (J.give === 'gold') { const n = (hurt ? 20 : 40) + Math.floor(rng() * 15); if (S) S.gold = (S.gold || 0) + n; gain = `+${n} 💰` }
        else if (J.give === 'reveal') { if (S) S.revealQueue = (S.revealQueue || 0) + 1; gain = 'แผนที่ทางไปจุดหมายชัดขึ้น' }
        j.back = now; j.gain = gain; j.hurt = hurt; j.storyText = story; j.reported = false;
        const result = story + (hurt ? ' แต่' + pick(LN.JOB_HURT) : '');
        emit(hurt ? 'job:hurt' : 'job:done', { who: id, job: j.kind, jobName: J.name, result, witness: [id], t: j.end });
        if (hurt) npc(id).flags.hurtUntil = j.end + 24;
        out.push({ id, kind: j.kind, gain, hurt, story: result });
      }
      if (out.length) save(); return out;
    }

    /* ---------- relationships ---------- */
    const pairKey = (a, b) => [a, b].sort().join('|');
    const rel = (a, b) => load().rel[pairKey(a, b)] || 0;
    function addRel(a, b, d) { const m = load(); m.rel[pairKey(a, b)] = Math.max(-5, Math.min(10, rel(a, b) + d)) }
    function affect(id, d) { const n = npc(id); n.aff = Math.max(-5, Math.min(10, n.aff + d)) }

    /* ---------- talking ---------- returns { text, kind, reward?, want?, job? } */
    function talk(id, ctx = {}) {
      const P = people(), p = P[id] || { id, name: id }, n = npc(id), m = load(), now = clock(), per = ctx.period || 'day', S = ctx.save;
      tick(S); n.talks = (n.talks || 0) + 1; if ((n.lastTalk || -99) < now - 3) { affect(id, 1); n.lastTalk = now }
      let out = null;
      /* 1 · back from a job you sent them on */
      const j = m.jobs[id];
      if (!out && j?.back && !j.reported) { j.reported = true; out = { kind: 'job', text: compose(id, `กลับมาแล้ว! ${j.storyText}${j.hurt ? ' … แต่ข้าเจ็บมานิดหน่อย' : ''} — ได้${j.gain}`, {}, { open: .8, close: .2 }) }; delete m.jobs[id] }
      /* 2 · the favour you did for them */
      const ws = wantState(id);
      if (!out && ws?.met) { const reward = finishWant(id, S); out = { kind: 'want-done', reward, text: compose(id, ws.def.thanks, {}, { open: .6, close: 0 }) } }
      /* 3 · news they heard and have not told you yet (most important first) */
      if (!out) {
        const news = known(id, now).filter(e => !n.said[e.id] && !(e.who === id && /^(job|recruit|want)/.test(e.type)))
          .sort((a, b) => (LN.EVENTS[b.type].sal - LN.EVENTS[a.type].sal) || (b.t - a.t));
        for (const e of news.slice(0, 3)) {
          n.said[e.id] = 1; const { list } = reactLines(id, e); const core = fresh(id, list);
          if (core) { out = { kind: 'news', event: e.type, text: compose(id, core, e) }; break }
        }
      }
      /* 4 · a favour they want to ask */
      if (!out && ws && !ws.asked && n.talks >= 2) { askWant(id); out = { kind: 'want', want: id, text: compose(id, ws.def.ask, {}, { open: .7, close: 0 }) } }
      /* 5 · first meeting */
      if (!out && !n.met && p.family) n.met = now;
      if (!out && !n.met) { n.met = now; const v = voiceOf(id); out = { kind: 'meet', text: compose(id, fresh(id, v.meet), {}, { open: 0, close: .5 }) } }
      /* 6 · small talk: their own lines for the time of day, their voice, how close you are, what changed for them */
      if (!out) {
        const v = voiceOf(id), own = [...(ctx.place === 'inn' ? p.lines?.inn || [] : []), ...(p.lines?.[per] || p.lines?.day || [])];
        let pool = [...own, ...own, ...v.small];
        if (n.aff >= 3) pool.push(...v.friend);
        if (ws?.done) pool.push(...ws.def.after, ...ws.def.after);
        if (ws?.asked && !ws.done && rng() < .3) pool.push('ยังรอเรื่องที่ข้าขอไว้นะ — ' + ws.def.hint);
        if (n.flags.hurtUntil > now) pool.push('แผลจากงานคราวก่อนยังเจ็บอยู่เลย … แต่ไม่เป็นไรหรอก');
        if (away(id, now)) pool = ['…'];
        out = { kind: 'small', text: compose(id, fresh(id, pool) || '…') };
      }
      save(); return out;
    }
    /* a short line said aloud in the room (does not use up news; still avoids repeats) */
    function bubble(id, ctx = {}) {
      const P = people(), p = P[id] || {}, n = npc(id), now = clock(), per = ctx.period || 'day';
      if (rng() < .35) { const e = known(id, now).filter(e => LN.EVENTS[e.type].sal >= 2 && e.who !== id).sort((a, b) => b.t - a.t)[0]; if (e) { const core = fresh(id, reactLines(id, e).list); if (core) { remember(id, core); save(); return fillSlots(core, e, id) } } }
      const own = [...(ctx.place === 'inn' ? p.lines?.inn || [] : []), ...(p.lines?.[per] || p.lines?.day || [])], v = voiceOf(id);
      const core = fresh(id, [...own, ...own, ...v.small]); if (!core) return '';
      remember(id, core); save(); return fillSlots(core, {}, id);
    }

    /* ---------- scenes ---------- people sharing a room talk to each other */
    function sceneOk(sc, present, ctx, now) {
      if (!sc.who.every(w => present.includes(w))) return false;
      const w = sc.when || {}, last = load().scenes[sc.id];
      if (last != null && (sc.cd === 0 || now - last < sc.cd * 24)) return false;
      if (w.place && w.place !== ctx.place) return false;
      if (w.period && w.period !== ctx.period) return false;
      if (w.rel && rel(w.rel[0], w.rel[1]) < w.rel[2]) return false;
      if (w.ev) { const [t, d] = w.ev.split('@'); if (!known(sc.who[0], now).some(e => e.type === t && (!d || e.dest === d)) && !(load().counts[w.ev] > 0)) return false }
      return true;
    }
    function scene(present, ctx = {}) {
      const now = clock(), m = load(); present = present.filter(id => !away(id, now));
      const ok = LN.SCENES.filter(sc => sceneOk(sc, present, ctx, now));
      let sc = ok.find(s => s.when?.ev) || (ok.length ? pick(ok) : null), e = {};
      if (sc) { m.scenes[sc.id] = now; if (sc.effect?.rel) addRel(...sc.effect.rel); const ev = sc.when?.ev?.split('@'); if (ev) e = load().events.filter(x => x.type === ev[0] && (!ev[1] || x.dest === ev[1])).slice(-1)[0] || {}; save(); return { id: sc.id, lines: sc.lines.map(([who, t]) => [who, fillSlots(t, e, who)]) } }
      /* nothing written for them: a small generic chat between two people (once per pair every half day) */
      const P = people(), cand = present.filter(id => P[id] && !P[id].benched);
      if (cand.length < 2) return null;
      const a = pick(cand), b = pick(cand.filter(x => x !== a)), key = 'pair:' + pairKey(a, b);
      if (m.scenes[key] != null && now - m.scenes[key] < 12) return null;
      const tpl = pick(LN.PAIR), line = id => { const p = P[id]; const own = p.lines?.[ctx.period] || p.lines?.day || []; return fresh(id, [...own, ...voiceOf(id).small]) || '…' };
      const al = line(a), bl = line(b);
      m.scenes[key] = now; addRel(a, b, .5); save();
      return { id: key, lines: tpl.map(([w, t]) => { const self = w === 'a' ? a : b; return [self, fillSlots(t.replace(/\{a\}/g, P[a].name).replace(/\{b\}/g, P[b].name).replace(/\{arole\}/g, P[a].role).replace(/\{brole\}/g, P[b].role).replace(/\{aline\}/g, al).replace(/\{bline\}/g, bl), {}, self)] }) };
    }

    return { KEY, VERSION, load, save, reload, migrate, emit, prune, known, knows, talk, bubble, scene, startJob, tick, away, canWork, wantState, rel, addRel, affect, npc, fillSlots, get state() { return load() } };
  }

  root.VillageMind = { create };
  if (root.VillageLines && !root.Mind) root.Mind = create();
  if (typeof module !== 'undefined' && module.exports) module.exports = { create };
})(typeof globalThis !== 'undefined' ? globalThis : this);
