(() => {
  'use strict';

  function boot() {
    const title = document.getElementById('titleScreen');
    if (!title || !window.TitleScreen?.active || window.TitleScreen.newGame) return;

    const brand = title.querySelector('.ts-brand');
    const main = title.querySelector('.ts-main');
    if (!brand || !main) return;

    brand.querySelector('h1').textContent = 'Agrenor';
    brand.querySelector('.ts-kicker').textContent = 'EVERY SMALL BEGINNING';
    brand.querySelector('p').textContent = ':Paths Unwritten';
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
