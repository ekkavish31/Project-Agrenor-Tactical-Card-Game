(() => {
  'use strict';

  function boot() {
    const title = document.getElementById('titleScreen');
    if (!title || !window.TitleScreen?.active || window.TitleScreen.newGame) return;

    const brand = title.querySelector('.ts-brand');
    const main = title.querySelector('.ts-main');
    if (!brand || !main) return;

    // Title block, big to small: Agrenor, Paths Unwritten, then the tagline.
    const kicker = brand.querySelector('.ts-kicker');
    const h1 = brand.querySelector('h1');
    h1.textContent = '';
    const logo = document.createElement('img');
    logo.className = 'ag-logo'; logo.src = 'assets/intro/agrenor-logo.webp?v=2'; logo.alt = 'Agrenor: Paths Unwritten'; logo.draggable = false;
    h1.append(logo);
    brand.querySelector('p').remove();
    kicker.textContent = 'EVERY SMALL BEGINNING\nCAN CHANGE A GREATER WORLD';
    brand.append(kicker);
    title.classList.add('ag-title');
    const horizon = document.createElement('div');
    horizon.className = 'ag-horizon'; horizon.setAttribute('aria-hidden', 'true'); horizon.textContent = 'To New Horizons';
    main.append(horizon);

    const replay = document.createElement('button');
    replay.className = 'ag-replay';
    replay.textContent = 'ดูบทเปิดอีกครั้ง';
    main.append(replay);

    /* v98.172/175 · load order: black gate with a progress bar -> the logo iframe, intro BGM (blob), menu images + font and the whole video
       are loaded first -> "press any key" appears -> the key press unlocks audio and starts the logo with nothing left to load -> the video
       fades in over the logo's last frame -> menu. */
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'OS', 'CapsLock', 'NumLock', 'ScrollLock', 'Fn', 'FnLock', 'ContextMenu']);
    let playback = 0;

    /* v98.180 · the menu's reveal animation (~5.6 s) can be skipped: any key / click / tap makes everything appear at once. That first press is swallowed
       (it must not hit a menu button that is still invisible). */
    const hint = document.createElement('div');
    hint.className = 'ag-skiphint'; hint.setAttribute('aria-hidden', 'true'); hint.textContent = 'กดปุ่มใดก็ได้เพื่อข้าม';
    main.append(hint);
    let revealTimer = 0, swallowUntil = 0;
    new MutationObserver(() => {
      const on = title.classList.contains('ag-reveal');
      if (on && !revealTimer) { title.classList.remove('ag-reveal-skip', 'ag-reveal-done'); revealTimer = setTimeout(() => title.classList.add('ag-reveal-done'), 5900); }
      else if (!on && revealTimer) { clearTimeout(revealTimer); revealTimer = 0; title.classList.remove('ag-reveal-skip', 'ag-reveal-done'); }
    }).observe(title, { attributes: true, attributeFilter: ['class'] });
    const revealing = () => title.classList.contains('ag-reveal') && !title.classList.contains('ag-reveal-skip') && !title.classList.contains('ag-reveal-done');
    const skipReveal = e => {
      if (!revealing()) return;
      if (e.type === 'keydown' && (e.repeat || MODIFIER_KEYS.has(e.key))) return;
      e.preventDefault(); e.stopPropagation();
      swallowUntil = performance.now() + 700;
      title.classList.add('ag-reveal-skip');
    };
    const swallow = e => { if (performance.now() < swallowUntil) { e.preventDefault(); e.stopPropagation(); } };
    document.addEventListener('keydown', skipReveal, true);
    document.addEventListener('pointerdown', skipReveal, true);
    for (const t of ['click', 'keyup']) document.addEventListener(t, swallow, true);

    function showGate() {
      const gate = document.createElement('div');
      gate.id = 'agGate'; gate.setAttribute('role', 'button'); gate.tabIndex = 0;
      const msg = document.createElement('span'); msg.className = 'ag-gate-msg'; msg.textContent = 'กำลังเตรียมเกม… 0%';
      const bar = document.createElement('div'); bar.className = 'ag-gate-bar';
      const fill = document.createElement('i'); bar.append(fill);
      gate.append(msg, bar); title.append(gate);
      return { gate, msg, fill };
    }

    /* Everything the menu itself needs: background + logo images decoded, the Wizzta font. */
    function preloadMenu() {
      const image = url => new Promise(resolve => {
        const im = new Image();
        im.onload = im.onerror = () => resolve();
        im.src = url;
        if (im.decode) im.decode().then(resolve, resolve);
      });
      const font = document.fonts?.load
        ? Promise.all(['20px Wizzta', '400 16px AgThai', '600 16px AgThai', '700 16px AgThai'].map(f => document.fonts.load(f, 'กขค').catch(() => {})))
        : Promise.resolve();
      return Promise.all([image('assets/intro/menu-bg.webp?v=3'), image('assets/intro/agrenor-logo.webp?v=2'), font]);
    }

    function runOpening(current) {
      if (playback !== current || !title.isConnected) return;
      window.addEventListener('maker-intro-finished', () => {
        // Logo held its last frame for 2 s (MakerLogo.beforeOutro waited for the video buffer); the video now fades in over it.
        requestAnimationFrame(() => {
          if (playback !== current || !title.isConnected) return;
          window.addEventListener('maker-intro-finished', () => {
            if (playback === current) title.classList.remove('ag-intro-pending');
          }, { once: true });
          window.GameIntro?.play(title);
        });
      }, { once: true });
      if (window.MakerLogo) window.MakerLogo.beforeOutro = () => window.GameIntro?.prepare?.();
      window.MakerLogo?.play(title);
      window.GameBGM?.unlock?.(); // inside the key/tap handler: resume the logo's Web Audio context right away
    }

    function playOpening(first) {
      document.getElementById('agGate')?.remove();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        title.classList.remove('ag-intro-pending');
        return;
      }

      const current = ++playback;
      title.classList.remove('ag-reveal');
      title.classList.add('ag-intro-pending');
      const gate = first === true ? showGate() : null; // replay already comes from a click, no gate needed

      /* v98.175 · load everything for the intro and the menu BEFORE "press any key" appears: logo iframe (decoded), intro BGM blob,
         menu images + font, and the whole intro video (progress bar). Weights follow the byte sizes. */
      const W = { logo: .03, bgm: .03, menu: .04, video: .9 }, got = { logo: 0, bgm: 0, menu: 0, video: 0 };
      let ready = false;
      const report = () => {
        if (!gate) return;
        const v = Math.min(1, Object.keys(W).reduce((sum, k) => sum + W[k] * got[k], 0));
        gate.fill.style.transform = `scaleX(${v})`;
        if (!ready) gate.msg.textContent = 'กำลังเตรียมเกม… ' + Math.round(v * 100) + '%';
      };
      const finished = key => () => { got[key] = 1; report(); };
      const tasks = [
        Promise.resolve(window.MakerLogo?.prepare?.(title)).catch(() => false).then(finished('logo')),
        Promise.resolve(window.GameBGM?.preloadIntro?.()).catch(() => false).then(finished('bgm')),
        preloadMenu().catch(() => {}).then(finished('menu')),
        Promise.resolve(window.GameIntro?.prepare?.(p => { got.video = Math.max(got.video, p); report(); })).catch(() => {}).then(finished('video')),
      ];
      // A very slow connection must not trap the player: after 75 s stop downloading the video and let it stream instead.
      const small = Promise.race([Promise.all(tasks), wait(75000).then(() => { window.GameIntro?.fallback?.(); return Promise.all(tasks); })]);

      if (!gate) { small.then(() => runOpening(current)); return; }

      let pressed = false, started = false;
      const go = () => {
        if (started || !pressed || !ready || playback !== current || !title.isConnected) return;
        started = true;
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('pointerup', onPointer, true);
        gate.gate.classList.add('out');
        setTimeout(() => gate.gate.remove(), 600);
        gate.gate.id = ''; // stop the BGM selector from treating the gate as still up
        runOpening(current);
      };
      const press = e => {
        e.preventDefault(); e.stopPropagation();
        pressed = true;
        window.GameBGM?.unlock?.();
        window.GameBGM?.prime?.();
        go();
      };
      const onKey = e => { if (e.repeat || MODIFIER_KEYS.has(e.key)) return; press(e); };
      const onPointer = e => { if (e.button > 0) return; press(e); };
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('pointerup', onPointer, true);

      small.then(() => {
        if (playback !== current) return;
        ready = true;
        gate.msg.textContent = matchMedia('(pointer:coarse)').matches ? 'แตะหน้าจอเพื่อเริ่ม' : 'กดปุ่มใดก็ได้เพื่อเริ่ม';
        gate.gate.classList.add('ready');
        go();
      });
    }

    replay.addEventListener('click', () => playOpening(false));
    playOpening(true);
  }

  if (document.readyState !== 'complete' && !document.getElementById('titleScreen')) {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
