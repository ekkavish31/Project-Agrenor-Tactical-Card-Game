/* v98.179 · shared "old RPG talk" for every spoken / narrated text box (story cutscenes, prologue pages, villager talk, battle talk).

   • Text is typed quickly in long runs (word by word, but ~4× faster than before) and the sentences of a speaker are merged into one passage.
   • A passage is split into PAGES that fit the box (maxLines). The split is only ever made at a sentence boundary (a source line, "…", "?", "!",
     "ฯ", ".", a line break); only a single sentence that is longer than the whole box is split — at a word boundary — as a last resort.
     When a page is full the typing stops and waits for the player (the caller's press → nextPage()). Nothing is dropped or replaced unread.
   • While a sentence is typed a synthesized "ตรื้ดดดด" voice plays (FF/DQ-style rapid square-wave blips, one pitch set per speaker) and stops at
     the end of every sentence. Volume follows the game's sound-effect volume (BattlePolish.volume); nothing is played when it is 0 or when the
     browser still blocks audio.

   API:  const T = DialogueFX.create(el, {maxLines, voice, onPageStart(text,i), onPageDone(skipped)});
         T.load([sentenceOrLine,…]); T.start();            // measures the visible element, builds the pages, types page 0
         T.finish() → true if it completed a running page  // 1st press while typing
         T.hasMore() / T.nextPage()                         // 2nd press when more pages remain
         T.add([line,…])                                    // append more text (new pages after the current ones)
         T.busy() · T.pageText() · T.stop() */
(function (root) {
  'use strict';
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
  const SEG = (() => { try { return new Intl.Segmenter('th', { granularity: 'word' }); } catch { return null; } })();
  const words = t => SEG ? [...SEG.segment(String(t))].map(x => x.segment) : String(t).split(/(\s+)/).filter(Boolean);
  const isSpace = s => /^\s+$/.test(s);

  /* ---------------- voice: rapid blips ---------------- */
  const BASES = [147, 165, 185, 196, 220, 247, 262, 294, 330, 370, 415];
  const PRESET = { hero: { base: 330, wave: 'square', gain: 1 }, mom: { base: 294, wave: 'triangle', gain: 1.2 }, elder: { base: 147, wave: 'square', gain: 1 } };
  const PATTERN = [0, 4, 7, 4, 9, 7, 2, 5, 9, 4];   // semitone steps: the flutter that makes the buzz
  function voiceFor(key) {
    if (!key) return { base: 196, wave: 'triangle', gain: .85 };          // narration: softer, lower
    if (PRESET[key]) return PRESET[key];
    let h = 2166136261;
    for (const c of String(key)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    return { base: BASES[h % BASES.length], wave: (h >>> 8) % 3 ? 'square' : 'triangle', gain: 1 };
  }
  let ac = null, voice = voiceFor(null), activeUntil = 0, timerId = 0, step = 0;
  function sfxVolume() {
    try { const P = root.BattlePolish || root.parent?.BattlePolish, v = Number(P?.volume); return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1; } catch { return 1; }
  }
  function audio() {
    try {
      if (!ac) { const C = root.AudioContext || root.webkitAudioContext; if (!C) return null; ac = new C(); }
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      return ac.state === 'running' ? ac : null;
    } catch { return null; }
  }
  function blip() {
    const c = audio(); if (!c) return;
    const vol = sfxVolume(); if (!vol) return;
    const t = c.currentTime, semi = PATTERN[step++ % PATTERN.length] + (Math.random() < .2 ? 2 : 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = voice.wave; o.frequency.setValueAtTime(voice.base * Math.pow(2, semi / 12), t);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.045 * vol * voice.gain, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .042);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + .05);
  }
  /* keep the voice running for `ms` more milliseconds (typing refreshes this every step; a pause between sentences lets it lapse) */
  function talkFor(ms) {
    activeUntil = performance.now() + ms;
    if (timerId) return;
    blip();
    timerId = setInterval(() => { if (document.hidden || performance.now() > activeUntil) { clearInterval(timerId); timerId = 0; return; } blip(); }, 58);
  }
  const hush = () => { activeUntil = 0; };
  /* create + resume the AudioContext inside the first key/tap of this page (Safari / mobile only allow that inside a gesture) */
  for (const ev of ['pointerdown', 'keydown', 'touchend']) document.addEventListener(ev, () => { audio(); }, { capture: true, passive: true });

  /* ---------------- sentences & pages ---------------- */
  /* → [{t, nl}] : sentences of one text (nl = it starts after a line break inside the text) */
  function sentences(text) {
    const out = [];
    String(text).split('\n').forEach((line, li) => {
      const cs = [...line]; let cur = '', first = true;
      const flush = () => { const t = cur.trim(); if (t) { out.push({ t, nl: li > 0 && first }); first = false; } cur = ''; };
      for (let k = 0; k < cs.length; k++) {
        cur += cs[k];
        const end = /[…?!。ฯ]/.test(cs[k]) || (cs[k] === '.' && (k + 1 >= cs.length || /\s/.test(cs[k + 1])));
        if (!end) continue;
        while (k + 1 < cs.length && /[…?!。ฯ.”’"')]/.test(cs[k + 1])) cur += cs[++k];
        if (k + 1 >= cs.length || /\s/.test(cs[k + 1])) { flush(); while (k + 1 < cs.length && /\s/.test(cs[k + 1])) k++; }
      }
      flush();
    });
    return out;
  }

  function create(el, opts) {
    const o = Object.assign({ maxLines: 4, voice: null, speed: 1, onPageStart: null, onPageDone: null }, opts || {});
    let pages = [], pi = -1, segs = [], spans = [], j = 0, shown = '', ei = 0, timer = 0, typing = false, probe = null, limit = 0;

    function dropProbe() { probe?.remove(); probe = null; }
    function makeProbe() {
      dropProbe();
      const w = el.getBoundingClientRect().width;
      if (!el.isConnected || !w) return false;
      const cs = getComputedStyle(el), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.6;
      limit = lh * o.maxLines + (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0) + 2;
      probe = el.cloneNode(false);
      probe.removeAttribute('id'); probe.removeAttribute('hidden'); probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText += ';position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;height:auto;min-height:0;max-height:none;overflow:visible;animation:none;transition:none;width:' + w + 'px';
      (el.parentNode || document.body).appendChild(probe);
      return true;
    }
    const fits = t => { probe.textContent = t; return probe.scrollHeight <= limit; };

    /* units → pages. A page break is made only between sentences; one over-long sentence is split at word boundaries. */
    function paginate(texts) {
      const units = [];
      texts.forEach(txt => sentences(txt).forEach((s, i) => units.push({ t: s.t, sep: s.nl ? '\n' : ' ' })));
      if (!units.length) return [];
      if (!probe && !makeProbe()) {   // box not measurable (hidden): one page
        let t = '', ends = [];
        units.forEach((u, i) => { t += (i ? u.sep : '') + u.t; ends.push(t.length); });
        return [{ text: t, ends }];
      }
      const out = []; let cur = '', ends = [];
      const push = () => { if (cur) out.push({ text: cur, ends }); cur = ''; ends = []; };
      for (const u of units) {
        const cand = cur ? cur + u.sep + u.t : u.t;
        if (fits(cand)) { cur = cand; ends.push(cur.length); continue; }
        push();
        if (fits(u.t)) { cur = u.t; ends = [cur.length]; continue; }
        let buf = '';                                   // a single sentence longer than the box: last resort, word boundary
        for (const w of words(u.t)) {
          const c2 = buf + w;
          if (!buf || fits(c2)) buf = c2;
          else { const t = buf.trimEnd(); out.push({ text: t, ends: [t.length] }); buf = w.replace(/^\s+/, ''); }
        }
        cur = buf; ends = [cur.length];
      }
      push();
      return out;
    }

    function runPage() {
      clearTimeout(timer);
      const pg = pages[pi]; if (!pg) return;
      segs = words(pg.text); j = 0; shown = ''; ei = 0; typing = true; voice = voiceFor(o.voice); spans = [];
      el.textContent = '';
      o.onPageStart && o.onPageStart(pg.text, pi);
      if (reduced() || o.instant) { el.textContent = pg.text; typing = false; o.onPageDone && o.onPageDone(false); return; }
      /* v98.181 · stable layout: the whole page is placed first (hidden), then each word is switched on in the spot it will keep — centred text no longer
         grows outwards from the middle; the first word already sits where it will end up and the rest extends behind it */
      for (const sg of segs) { const sp = document.createElement('span'); sp.textContent = sg; sp.style.visibility = 'hidden'; el.appendChild(sp); spans.push(sp); }
      tick();
    }
    function tick() {
      const seg = segs[j++]; shown += seg; spans[j - 1].style.visibility = 'visible';
      if (j >= segs.length) { typing = false; hush(); o.onPageDone && o.onPageDone(false); return; }
      const pg = pages[pi], t = seg.trim();
      let d = isSpace(seg) ? (/\n/.test(seg) ? 380 : 46) : Math.max(22, Math.min(105, seg.length * 16));
      d /= o.speed;
      let breath = false;
      if (ei < pg.ends.length && shown.length >= pg.ends[ei]) { ei++; breath = true; d += /(…|\.\.\.)$/.test(t) ? 420 : /[?!]$/.test(t) ? 340 : 260; }
      else if (/(…|\.\.\.|[?!])$/.test(t) && /^\s/.test(segs[j] || '')) { breath = true; d += 320; }
      if (breath) hush(); else if (t) talkFor(d + 90);
      timer = setTimeout(tick, d);
    }

    const T = {
      load(texts) { dropProbe(); pages = paginate([].concat(texts).map(String)); pi = -1; return T; },
      add(texts) { const more = paginate([].concat(texts).map(String)); pages.push(...more); return more.length; },
      start() { if (!pages.length) return T; pi = 0; runPage(); return T; },
      finish() {
        if (!typing) return false;
        clearTimeout(timer); typing = false; hush();
        el.textContent = pages[pi].text;
        o.onPageDone && o.onPageDone(true);
        return true;
      },
      hasMore: () => pi < pages.length - 1,
      nextPage() { if (pi >= pages.length - 1) return false; pi++; runPage(); return true; },
      busy: () => typing,
      pageText: () => pages[pi]?.text || '',
      pageCount: () => pages.length,
      pages: () => pages.map(p => p.text),
      stop() { clearTimeout(timer); typing = false; hush(); dropProbe(); },
    };
    return T;
  }

  root.DialogueFX = { create, sentences, voiceFor, blip, hush };
})(globalThis);
