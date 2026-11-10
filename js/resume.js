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
  function write() {
    if (!applied && rd(KEY)) return;   /* the old record is still waiting to be used: do not overwrite it with the title-screen moment */
    const c = collect(); if (!c) return;
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, t: Date.now(), ...c })) } catch (e) { }
  }
  setInterval(write, 1500);
  addEventListener('pagehide', write); document.addEventListener('visibilitychange', () => { if (document.hidden) write() });

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function until(fn, ms = 30000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (fn()) return true } catch (e) { } await sleep(250) } return false }
  async function goHome() {
    const V = T(); try { s.village.location = 'home'; save() } catch (e) { }
    await until(() => V.isTownReady());
    V.enterPlace('home', ''); V.sync?.();
  }
  async function apply() {
    const V = T(), rec = rd(KEY), home = (() => { try { return sessionStorage.getItem(HOME) === '1' } catch (e) { return false } })();
    if (root.TitleScreen?.newGame) { try { localStorage.removeItem(KEY); sessionStorage.removeItem(HOME) } catch (e) { } return }
    if (home) { try { sessionStorage.removeItem(HOME); localStorage.removeItem(KEY) } catch (e) { } applied = true; await goHome(); return }
    if (!rec || Date.now() - rec.t > 30 * 864e5) { applied = true; return }
    applied = true;
    if (rec.kind === 'story') { await until(() => root.Story?.state?.()); await sleep(800); if (!(await root.Story?.resumeFight?.())) return; return }
    if (rec.kind === 'world') { V.resumeWorld(); return }
    if (rec.kind === 'wmBattle') { try { sessionStorage.setItem('projectA.wmResume', '1') } catch (e) { } V.resumeWorld(); return }
    if (rec.kind === 'town') { await until(() => V.frame.contentWindow.ResumeHook?.ready?.()); await sleep(400); try { V.frame.contentWindow.ResumeHook.set(rec.hero) } catch (e) { } return }
    if (rec.kind === 'place') { if (!V.resumePlace(rec.src)) return; await until(() => V.isMarketReady()); await sleep(900); try { V.marketFrame.contentWindow.ResumeHook?.set?.(rec.hero) } catch (e) { } }
  }
  /* wait until the player has left the title screen, then put them back */
  (async () => {
    await until(() => T() && root.TitleScreen && !root.TitleScreen.active, 24 * 3600e3);
    await sleep(600); try { await apply() } catch (e) { console.warn('[resume]', e); applied = true }
  })();
  root.Resume = { peek: () => rd(KEY), clear: () => localStorage.removeItem(KEY), collect };
})(globalThis);
