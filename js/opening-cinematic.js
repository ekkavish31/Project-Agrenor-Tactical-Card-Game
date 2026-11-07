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
    logo.className = 'ag-logo'; logo.src = 'assets/intro/agrenor-logo.webp'; logo.alt = 'Agrenor: Paths Unwritten'; logo.draggable = false;
    h1.append(logo);
    brand.querySelector('p').remove();
    kicker.textContent = 'EVERY SMALL BEGINNING';
    brand.append(kicker);
    title.classList.add('ag-title');

    const replay = document.createElement('button');
    replay.className = 'ag-replay';
    replay.textContent = 'ดูบทเปิดอีกครั้ง';
    main.append(replay);

    let playback = 0;
    function playOpening() {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        title.classList.remove('ag-intro-pending');
        return;
      }

      const currentPlayback = ++playback;
      title.classList.remove('ag-reveal');
      title.classList.add('ag-intro-pending');
      Promise.resolve(window.GameIntro?.prepare?.()).then(() => {
        if (playback !== currentPlayback || !title.isConnected) return;
        window.addEventListener('maker-intro-finished', () => {
          requestAnimationFrame(() => {
            if (playback !== currentPlayback || !title.isConnected) return;
            window.addEventListener('maker-intro-finished', () => {
              if (playback === currentPlayback) title.classList.remove('ag-intro-pending');
            }, { once: true });
            window.GameIntro?.play(title);
          });
        }, { once: true });
        window.MakerLogo?.play(title);
      }, error => {
        if (playback !== currentPlayback) return;
        console.error('Unable to prepare painted intro', error);
        title.classList.remove('ag-intro-pending');
        let notice = title.querySelector('.ag-audio-notice');
        if (!notice) {
          notice = document.createElement('div');
          notice.className = 'ag-audio-notice';
          notice.setAttribute('role', 'status');
          notice.setAttribute('aria-live', 'polite');
          title.append(notice);
        }
        notice.textContent = 'เตรียมภาพคัทซีนไม่สำเร็จ';
      });
    }

    replay.addEventListener('click', playOpening);
    playOpening();
  }

  if (document.readyState !== 'complete' && !document.getElementById('titleScreen')) {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
