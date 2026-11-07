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

    /* v98.172 · load order: black "press any key" gate -> (meanwhile) maker logo iframe + intro BGM are fetched/decoded -> key press unlocks
       audio and starts the logo with nothing left to load -> the 47 MB video keeps buffering during the logo -> video -> menu.
       The video is requested only after the small assets are ready so it does not compete with them for bandwidth. */
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'OS', 'CapsLock', 'NumLock', 'ScrollLock', 'Fn', 'FnLock', 'ContextMenu']);
    let playback = 0;

    function showGate() {
      const gate = document.createElement('div');
      gate.id = 'agGate'; gate.setAttribute('role', 'button'); gate.tabIndex = 0;
      const msg = document.createElement('span'); msg.className = 'ag-gate-msg'; msg.textContent = 'กำลังเตรียม…';
      gate.append(msg); title.append(gate);
      return { gate, msg };
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

      const small = Promise.race([
        Promise.all([
          Promise.resolve(window.MakerLogo?.prepare?.(title)).catch(() => false),
          Promise.resolve(window.GameBGM?.preloadIntro?.()).catch(() => false),
        ]),
        wait(8000),
      ]);
      small.then(() => window.GameIntro?.prepare?.());

      if (!gate) { small.then(() => runOpening(current)); return; }

      let pressed = false, ready = false, started = false;
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
        if (!ready) gate.msg.textContent = 'กำลังเตรียม…';
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
