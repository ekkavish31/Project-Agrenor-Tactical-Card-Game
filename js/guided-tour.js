/* v98.617 · GuidedTour — a TEACHING conversation that is played on the LIVE game: the two siblings talk at the sides of the screen (portraits left / right + a text box at the bottom),
   the middle stays the real village map, and the player is told to do each step by hand — only the highlighted thing can be clicked, an arrow points at it (it moves in and out), everything else is blocked.
   GuidedTour.run([step, …]) → Promise (resolves when the last step is done or Esc skips the tour)
   step = { who:'B'|'S', text, target?: selector | () => Element, wait?: 'click' (default when there is a target) | 'next' | () => boolean, hint?: 'อาร์โรว์ข้อความสั้น', pad?: px }
     • who 'B' = the elder brother · 'S' = the younger sister (resolved to the lead / the follower by js/story-fx.js roleWho) · text may use {Bn} {Sn} {S2B} {B2S} {hero} {sib}
     • no target → a text-only line: click ANYWHERE / Enter / Space = next      • target → the step finishes when the target is clicked (the click still goes through to it)
   The UI lives inside the open <dialog> when there is one (a modal dialog makes everything outside it inert), otherwise in <body>. */
(function (root) {
  'use strict';
  const css = `
#gtour{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:AgThai,VillageThai,system-ui,sans-serif}
/* v98.660 · NO MOVING CURTAIN: the four blockers only stop clicks (invisible, no transition); the dark veil is a fixed soft shadow around ONE ring that fades out, jumps to the next target and fades in — it never slides across the screen */
#gtour .blk{position:fixed;background:transparent;pointer-events:auto}
#gtour .veil{position:fixed;inset:0;background:rgba(8,4,2,.5);pointer-events:none;opacity:1;transition:opacity .18s ease}#gtour .veil.hide{opacity:0}
#gtour .ring{position:fixed;border:2px solid #f0cf84;border-radius:12px;box-shadow:0 0 22px #ffd77a,inset 0 0 14px #ffd77a55,0 0 0 200vmax rgba(8,4,2,.5);pointer-events:none;opacity:1;transition:opacity .18s ease;animation:gtPulse 2.4s ease-in-out infinite}#gtour .ring.hide{opacity:0}
#gtour .arrow{position:fixed;width:54px;height:54px;pointer-events:none;filter:drop-shadow(0 3px 5px #000a)}
#gtour .arrow svg{width:100%;height:100%;animation:gtBob .8s ease-in-out infinite;transform-origin:50% 50%}
#gtour .pic{position:fixed;bottom:0;height:min(58vh,520px);display:flex;align-items:flex-end;pointer-events:none;transition:filter .25s,opacity .25s,transform .25s}
#gtour .pic img{max-height:100%;max-width:26vw;object-fit:contain;filter:drop-shadow(0 8px 16px #000c)}
#gtour .pic.L{left:1vw}#gtour .pic.R{right:1vw}#gtour .pic.dim{filter:brightness(.55) saturate(.7);transform:translateY(8px)}
#gtour .box{position:fixed;left:50%;bottom:1.4vw;transform:translateX(-50%);width:min(72vw,1500px);padding:1.15vw 1.6vw 1.3vw;background:linear-gradient(#2a2016f2,#15100af2);border:1.5px solid #d8b46a;border-radius:1vw;box-shadow:0 12px 36px #000c;color:#fff1d2;pointer-events:auto}
#gtour.adv .blk,#gtour.adv .box{cursor:pointer}
/* v98.1070 · the teaching box is sized like the dialogue box (story.css .cs-box: 72 % of the screen width, type scales with the width) */
@media(max-width:640px){#gtour .box{width:calc(100vw - 20px);padding:12px 14px 16px;border-radius:12px;bottom:10px}#gtour .box b{font-size:17px}#gtour .box p{font-size:15px}}
#gtour .box b{display:block;color:#ffd98a;font-size:max(15px,1.75vw);margin-bottom:.3vw}
#gtour .box p{margin:0;font-size:max(13px,1.55vw);line-height:1.5;min-height:2.2em}
#gtour .box small{position:absolute;right:1.3vw;bottom:.7vw;color:#d8b46acc;font-size:max(11px,.9vw)}
#gtour .skip{position:fixed;right:.8vw;bottom:.8vw;z-index:5;background:#14100af0;border:1px solid #d8b46a;color:#f0dfb4;border-radius:999px;padding:max(5px,.45vw) max(12px,1.1vw);font-size:max(11px,.72vw);font-weight:700;cursor:pointer;pointer-events:auto;box-shadow:0 4px 14px #0008}#gtour .skip:hover{background:#2a2016}
body.gt-on #storyTracker,body.gt-on #storyToasts,body.gt-on #smithWip{visibility:hidden!important}
/* v98.1094 · FREE step (step.free): the player keeps playing — no blockers / veil / ring / portraits, clicks pass through to the game; only a compact talk box (the sibling) and the skip button stay */
#gtour.free .blk,#gtour.free .veil,#gtour.free .ring,#gtour.free .arrow,#gtour.free .pic{display:none!important}
#gtour.free .box{width:min(44vw,760px);bottom:1vw;cursor:default}
/* v98.665 · bright tour (the book lesson): no dark veil, no dark ring shadow — the book stays fully lit the whole time; only the gold ring + arrow point */
#gtour.bright .veil{display:none}#gtour.bright .ring{box-shadow:0 0 22px #ffd77a,inset 0 0 14px #ffd77a55;animation-name:gtPulseB}
@keyframes gtPulseB{50%{box-shadow:0 0 34px #ffe9a8,inset 0 0 20px #ffd77a88}}
@keyframes gtPulse{50%{box-shadow:0 0 34px #ffe9a8,inset 0 0 20px #ffd77a88,0 0 0 200vmax rgba(8,4,2,.5)}}
@keyframes gtBob{0%,100%{transform:translate(0,0)}50%{transform:translate(var(--bx,0),var(--by,0))}}`;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  /* the page itself and every same-origin frame (the village map lives in an iframe: its icon row is what the player really sees) */
  const docs = () => { const out = [document]; for (const f of document.querySelectorAll('iframe')) { try { const d = f.contentDocument; if (d && d.body && f.getBoundingClientRect().width > 0 && !f.hidden) out.push(d) } catch (e) { } } return out };
  const visible = e => { try { const r = e.getBoundingClientRect(); if (r.width < 2) return false; const cs = e.ownerDocument.defaultView.getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' } catch (x) { return false } };
  const query = spec => { if (typeof spec === 'function') return spec(); for (const d of docs()) { for (const e of d.querySelectorAll(spec)) if (visible(e)) return e } return null };
  const rectOf = e => { const r = e.getBoundingClientRect(), d = e.ownerDocument; if (d === document) return r; let fx = 0, fy = 0; try { const f = d.defaultView.frameElement.getBoundingClientRect(); fx = f.left; fy = f.top } catch (x) { } return { left: r.left + fx, top: r.top + fy, right: r.right + fx, bottom: r.bottom + fy, width: r.width, height: r.height } };
  /* anything that could cover the lesson: the Esc menu of the village, the quest window, toasts — removed / hidden while a tour runs */
  const quiet = () => { for (const d of docs()) { d.getElementById('cuMenu')?.remove(); const h = d.getElementById('townHudPop'); void h } };
  const lookOf = who => { const female = (() => { try { return root.HeroVariant?.get?.() === 'female' } catch (e) { return false } })(), isLead = who === 'hero'; return isLead ? (female ? 'hero-female' : 'hero-male') : (female ? 'hero-male' : 'hero-female') };
  const resolve = (C, who) => C?.roleWho ? C.roleWho(who) : (who === 'S' ? 'sib' : 'hero');
  async function run(steps, opt = {}) {
    if (!steps?.length) return; if (document.getElementById('gtour')) return;
    if (!document.getElementById('gtourCss')) { const st = document.createElement('style'); st.id = 'gtourCss'; st.textContent = css; document.head.append(st) }
    const C = root.Cutscene, fill = t => C?.fill ? C.fill(t) : String(t || '');
    const el = document.createElement('div'); el.id = 'gtour'; if (opt.bright) el.className = 'bright';
    el.innerHTML = '<div class="blk" data-b="t"></div><div class="blk" data-b="b"></div><div class="blk" data-b="l"></div><div class="blk" data-b="r"></div><div class="veil"></div><div class="ring hide"></div><div class="arrow" hidden><svg viewBox="0 0 54 54"><path d="M27 4 L48 30 H35 V50 H19 V30 H6 Z" fill="#ffd77a" stroke="#5a3a0a" stroke-width="3" stroke-linejoin="round"/></svg></div><div class="pic L"></div><div class="pic R"></div><div class="box"><b></b><p></p><small>คลิกที่ไหนก็ได้เพื่อไปต่อ</small><button class="skip" type="button">ข้ามบทสอน (Esc)</button></div>';
    const mount = () => { const dl = document.querySelectorAll('dialog[open]'), host = dl.length ? dl[dl.length - 1] : document.body;   quiet();   /* the TOPMOST open dialog (a card view opens above the book) */ if (el.parentNode !== host) host.append(el); };
    mount();
    const $ = s => el.querySelector(s), blk = k => $(`[data-b="${k}"]`), ring = $('.ring'), arrow = $('.arrow'), box = $('.box'), say = box.querySelector('p'), nm = box.querySelector('b');
    const lead = { hero: lookOf('hero'), sib: lookOf('sib') };
    for (const [side, w] of [['L', 'hero'], ['R', 'sib']]) { const img = new Image(); img.alt = ''; const src = `assets/portraits/${lead[w]}-neutral.webp`; img.src = src; if (root.PortraitFacing?.flip(src, side)) img.style.transform = 'scaleX(-1)'; $('.pic.' + side).append(img) }
    let skipped = false, targetEl = null, stepDone = null, typeTimer = 0, typed = '', shown = '', lastTarget = null, warpAt = 0, curNext = false;
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); skipped = true; stepDone?.() } else if ((e.key === 'Enter' || e.key === ' ') && (!targetEl || curNext) && !curFree) { e.preventDefault(); e.stopPropagation(); advance() } };
    addEventListener('keydown', onKey, true);
    /* v98.667 · a "read this" step (wait:'next') only POINTS at its target: a click on it must advance the talk, never open what is underneath (a card's detail window would trap the lesson) */
    const onClick = e => { if (!curNext || !targetEl || !targetEl.contains?.(e.target)) return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); advance() };
    addEventListener('click', onClick, true);
    el.append($('.skip'));   /* the box is transformed (fixed children would be placed against it): the skip button lives on the overlay root so it sits in the screen's bottom-right corner */
    $('.skip').onclick = e => { e.stopPropagation(); skipped = true; stepDone?.() };
    const finishType = () => { clearInterval(typeTimer); typeTimer = 0; say.textContent = typed; shown = typed };
    const advance = () => { if (typeTimer) { finishType(); return } if (curFree) return; if (!targetEl || curNext) stepDone?.() };
    /* v98.1000 · a "read" step goes on with a click ANYWHERE on the screen (the invisible blockers + the box all bubble to the overlay); an "action" step (a target that must be clicked) still ignores everything but that target */
    el.addEventListener('click', e => { if (e.target.closest('.skip')) return; advance() });
    let curSpec = null;
    let curFree = false;
    const place = () => {   /* keep the spotlight on the (possibly moving) target */
      mount();
      if (curFree) return;   /* v98.1094 · a free step shows no spotlight */
      if (curSpec && targetEl && !targetEl.isConnected) { const e = query(curSpec); if (e) targetEl = e }   /* the book redraws itself: follow the new element */
      const W = innerWidth, H = innerHeight;
      const veil = $('.veil');
      if (!targetEl || !targetEl.isConnected) { for (const k of 'tblr') { const b = blk(k); Object.assign(b.style, { left: 0, top: 0, width: W + 'px', height: H + 'px' }) } blk('b').style.display = blk('l').style.display = blk('r').style.display = 'none'; ring.classList.add('hide'); veil.classList.remove('hide'); arrow.hidden = true; lastTarget = null; return }
      veil.classList.add('hide');
      for (const k of 'blr') blk(k).style.display = '';
      const r = rectOf(targetEl), pad = 6, x0 = Math.max(0, Math.floor(r.left - pad)), y0 = Math.max(0, Math.floor(r.top - pad)), x1 = Math.min(W, Math.ceil(r.right + pad)), y1 = Math.min(H, Math.ceil(r.bottom + pad));   /* whole pixels only */
      Object.assign(blk('t').style, { left: 0, top: 0, width: W + 'px', height: y0 + 'px' }); Object.assign(blk('b').style, { left: 0, top: y1 + 'px', width: W + 'px', height: Math.max(0, H - y1) + 'px' });
      Object.assign(blk('l').style, { left: 0, top: y0 + 'px', width: x0 + 'px', height: (y1 - y0) + 'px' }); Object.assign(blk('r').style, { left: x1 + 'px', top: y0 + 'px', width: Math.max(0, W - x1) + 'px', height: (y1 - y0) + 'px' });
      /* a new target: fade the ring out, move it while invisible, fade it in (no sliding) */
      if (targetEl !== lastTarget) { lastTarget = targetEl; ring.classList.add('hide'); arrow.hidden = true; warpAt = performance.now() + 200 }
      if (performance.now() < warpAt) return;
      Object.assign(ring.style, { left: x0 + 'px', top: y0 + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px' }); ring.classList.remove('hide');
      /* the arrow sits on the side with the most room and points at the target; it moves in and out along that line */
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, room = { up: y0, down: H - y1, left: x0, right: W - x1 };
      const dir = Object.entries(room).sort((a, b) => b[1] - a[1])[0][0], A = 54, gap = 8;
      const pos = { up: [cx - A / 2, y0 - A - gap, 180], down: [cx - A / 2, y1 + gap, 0], left: [x0 - A - gap, cy - A / 2, 90], right: [x1 + gap, cy - A / 2, 270] }[dir];
      // the picture points UP at rotation 0 → "arrow above the target" has to point DOWN (180°)
      arrow.style.left = Math.max(4, Math.min(W - A - 4, pos[0])) + 'px'; arrow.style.top = Math.max(4, Math.min(H - A - 4, pos[1])) + 'px';
      const svg = arrow.querySelector('svg'); arrow.style.transform = `rotate(${pos[2]}deg)`;   /* the rotation lives on the outer box: the bobbing animation owns the svg's own transform */ const mv = ['0', '-10px'];   /* the box is rotated, so "toward the target" is always local up */ svg.style.setProperty('--bx', mv[0]); svg.style.setProperty('--by', mv[1]); arrow.hidden = false;
    };
    document.body.classList.add('gt-on'); try { document.activeElement?.blur?.(); window.focus() } catch (e) { }
    let raf = 0; const loop = () => { place(); raf = requestAnimationFrame(loop) }; loop();
    const findTarget = async spec => { const t0 = performance.now(); while (performance.now() - t0 < 4500 && !skipped) { const e = query(spec); if (e) return e; await sleep(120) } return null };
    try {
      for (const st of steps) {
        if (skipped) break;
        const who = resolve(C, st.who || 'S'), side = who === 'hero' ? 'L' : 'R'; $('.pic.L').classList.toggle('dim', side !== 'L'); $('.pic.R').classList.toggle('dim', side !== 'R');
        { const fem = root.HeroVariant?.get?.() === 'female'; nm.textContent = who === 'hero' ? (C?.fill ? C.fill('{hero}') : (fem ? 'น้องสาว' : 'พี่ชาย')) : (C?.fill ? C.fill('{sib}') : (fem ? 'พี่ชาย' : 'น้องสาว')) }
        typed = fill(st.text); say.textContent = ''; let i = 0; clearInterval(typeTimer); typeTimer = setInterval(() => { i += 2; say.textContent = typed.slice(0, i); if (i >= typed.length) { clearInterval(typeTimer); typeTimer = 0 } }, 22);
        curFree = !!st.free; el.classList.toggle('free', curFree); document.body.classList.toggle('gt-on', !(st.free || st.showTracker));   /* a free step / a step that points at the quest window leaves the quest window visible */
        curNext = st.wait === 'next'; el.classList.toggle('adv', (!st.target || curNext) && !curFree); box.querySelector('small').textContent = curFree ? 'ลองทำตามนี้ได้เลย · Esc = ข้ามบทสอน' : st.target && !curNext ? '👆 ทำตามที่บอก — กดตรงที่ลูกศรชี้' : 'คลิกที่ไหนก็ได้เพื่อไปต่อ';
        if (st.prep) { try { st.prep() } catch (e) { } await sleep(350) }   /* e.g. re-open the book if the previous click closed it */
        curSpec = st.target || null; targetEl = st.target ? await findTarget(st.target) : null;
        if (skipped) break;
        await new Promise(res => {
          stepDone = res;
          if (targetEl && curNext) { stepDone = res }
          else if (targetEl) { const ds = docs(), off = () => { for (const d of ds) d.removeEventListener('click', hit, true) }; const hit = ev => { const spec = typeof st.target === 'string' ? st.target : null; if (!targetEl || !(targetEl.contains(ev.target) || (spec && ev.target.closest?.(spec)))) return; off(); setTimeout(res, st.delay ?? 380) }; for (const d of ds) d.addEventListener('click', hit, true); stepDone = () => { off(); res() } }
          else if (typeof st.wait === 'function') { const t = setInterval(() => { if (st.wait()) { clearInterval(t); res() } }, 150) }
        });
        targetEl = null; stepDone = null;
      }
    } finally { document.body.classList.remove('gt-on'); cancelAnimationFrame(raf); clearInterval(typeTimer); removeEventListener('keydown', onKey, true); removeEventListener('click', onClick, true); el.remove() }
    return !skipped;
  }
  root.GuidedTour = { run };
})(globalThis);
