/* v98.340 · TWO-LAYER SAVE
   1. MAIN SAVE = the 3 slots of the menu (💾 บันทึกเกม / 📂 โหลดเกม, js/console-ui.js). Loading one starts at HOME (the hero's house).
   2. TEMPORARY SAVE = this file. While you play, the exact scene is written to localStorage 'projectA.resume' (every 1.5 s and when the page is hidden / closed):
        town        → where the hero stands on the village map
        place       → the sub-map / room that is open (the frame URL) + where the hero stands in it
        world       → the world map (the party's position lives in the world save)
        story       → a story fight (goat / pumpkin / festival raid): the arena is re-opened from its snapshot
        wmBattle    → a world-map fight: re-opened from its snapshot (the fight's record is 'projectA.wmFight')
      The fight snapshot ('projectA.battleSnap') is written by js/town-battle.js at every stable moment of the hero's turn.
   Continue (title screen) → this file puts you back. A loaded main-save slot sets sessionStorage 'projectA.startHome' instead and drops the temporary save.
   Dev: Resume.peek() · Resume.clear() */
(function (root) {
  'use strict';
  const KEY = 'projectA.resume', HOME = 'projectA.startHome';
  const T = () => root.VillageTown, rd = k => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch (e) { return null } };
  const hook = f => { try { return f.contentWindow.ResumeHook?.get?.() || null } catch (e) { return null } };
  function collect() {
    const V = T(); if (!V || root.TitleScreen?.active) return null;
    if (document.getElementById('storyBattle')) return { kind: 'story' };
    if (V.onWorld()) { let wm = false; try { wm = !!V.frame.contentWindow.document.getElementById('wmBattle') } catch (e) { } return { kind: wm ? 'wmBattle' : 'world' } }
    const sc = V.getScene();
    if (sc === 'town') return { kind: 'town', hero: hook(V.frame) };
    if (/^place:/.test(sc)) return { kind: 'place', src: V.marketFrame.getAttribute('src') || '', hero: hook(V.marketFrame) };
    return null;
  }
  let applied = false;
  /* v98.1010 · how the last resume went — Resume.last() · localStorage 'projectA.resumeLast' — so a failure can be seen (and is shown to the player as a toast) instead of silently dropping them elsewhere */
  let LAST = null;
  function note(ok, kind, why) { LAST = { ok, kind, why: ok ? '' : (why || ''), at: Date.now() }; try { localStorage.setItem('projectA.resumeLast', JSON.stringify(LAST)) } catch (e) { } if (!ok && why !== 'new-game') { try { root.toast?.('กลับไปที่เดิมไม่สำเร็จ (' + kind + '): ' + why) } catch (e) { } } }
  function write() {
    if (!applied && rd(KEY)) return;   /* the old record is still waiting to be used: do not overwrite it with the title-screen moment */
    const c = collect(); if (!c) return;
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, t: Date.now(), ...c })) } catch (e) { }
  }
  setInterval(write, 1500);
  addEventListener('pagehide', write); addEventListener('beforeunload', write); document.addEventListener('freeze', write); document.addEventListener('visibilitychange', () => { if (document.hidden) write() });

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function until(fn, ms = 30000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (fn()) return true } catch (e) { } await sleep(250) } return false }
  async function goHome() {
    const V = T(); try { s.village.location = 'home'; save() } catch (e) { }
    await until(() => V.isTownReady());
    V.enterPlace('home', ''); V.sync?.();
    await until(() => V.isMarketReady()); await until(() => V.marketFrame.contentWindow.ResumeHook?.ready?.()); await sleep(500);
  }
  /* v98.352 · prepare() runs while the loading screen is still up (title-screen.js puts it in the loading list), so the player never sees the default scene first;
     apply() is the same promise — the title-wait loop below only calls it when nothing did */
  let job = null;
  /* v98.1010 · `applied` is set whatever apply0 does (also the early returns): a New-Game session used to return from apply0 with applied=false, and write() then refused to overwrite the
     record it had itself written a moment before → the record froze at the first position of the session and Continue after a reload always went back there */
  const apply = () => job || (job = apply0().catch(e => { note(false, 'error', String(e && e.message || e)); console.warn('[resume]', e) }).finally(() => { applied = true }));
  async function apply0() {
    const V = T(), rec = rd(KEY), home = (() => { try { return sessionStorage.getItem(HOME) === '1' } catch (e) { return false } })();
    if (root.TitleScreen?.newGame) { try { localStorage.removeItem(KEY); sessionStorage.removeItem(HOME) } catch (e) { } note(true, 'new-game', 'new-game'); return }
    if (home) { try { sessionStorage.removeItem(HOME); localStorage.removeItem(KEY) } catch (e) { } applied = true; await goHome(); return }
    if (!rec) { applied = true; return }   /* v98.1010 · no age limit (was 30 days) */
    applied = true;
    /* v98.1010 · every kind records how it went (Resume.last) — a failure also shows a toast; a place's stored src is rewritten with the CURRENT game version (the one stored may be days old) */
    const fresh = u => { try { const x = new URL(u, location.href), v = root.GAME_VERSION?.v; if (v && x.searchParams.has('v')) x.searchParams.set('v', v); return x.pathname.split('/').pop() + x.search } catch (e) { return u } };
    if (rec.kind === 'story') { await until(() => root.Story?.state?.()); await sleep(800); note(!!(await root.Story?.resumeFight?.()), 'story', 'ศึกในเรื่องเปิดต่อไม่ได้ (ไม่มีศึกค้างอยู่ในเซฟ)'); return }
    if (rec.kind === 'world') { note(!!V.resumeWorld(), 'world', 'เปิดแผนที่โลกไม่ได้'); return }
    if (rec.kind === 'wmBattle') { try { sessionStorage.setItem('projectA.wmResume', '1') } catch (e) { } note(!!V.resumeWorld(), 'wmBattle', 'เปิดแผนที่โลกไม่ได้'); return }
    if (rec.kind === 'town') { const ok = await until(() => V.frame.contentWindow.ResumeHook?.ready?.()); await sleep(250); try { V.frame.contentWindow.ResumeHook.set(rec.hero) } catch (e) { note(false, 'town', 'วางตำแหน่งตัวละครไม่ได้'); return } note(ok, 'town', 'หมู่บ้านยังโหลดไม่เสร็จ'); return }
    if (rec.kind === 'place') { if (!V.resumePlace(fresh(rec.src))) { note(false, 'place', 'เปิดแมพย่อยไม่ได้'); return } const ok = await until(() => V.isMarketReady()) && await until(() => V.marketFrame.contentWindow.ResumeHook?.ready?.()); await sleep(700); try { V.marketFrame.contentWindow.ResumeHook?.set?.(rec.hero) } catch (e) { } await sleep(250); note(ok, 'place', 'แมพย่อยโหลดไม่เสร็จ') }
  }
  /* wait until the player has left the title screen, then put them back */
  (async () => {
    await until(() => T() && root.TitleScreen && !root.TitleScreen.active, 24 * 3600e3);
    await sleep(600); try { await apply() } catch (e) { console.warn('[resume]', e); applied = true }
  })();
  root.Resume = { prepare: apply, peek: () => rd(KEY), clear: () => localStorage.removeItem(KEY), collect, last: () => LAST };
})(globalThis);
