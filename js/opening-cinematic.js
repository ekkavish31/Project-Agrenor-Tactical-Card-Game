/* Short family vignette after the maker logo; leaves the existing game prologue untouched. */
(() => {
  'use strict';
  function boot() {
    const title = document.getElementById('titleScreen');
    if (!title || !window.TitleScreen?.active || window.TitleScreen.newGame) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const main = title.querySelector('.ts-main');
    if (!main) return;
    const brand = title.querySelector('.ts-brand');
    brand.querySelector('h1').textContent = 'AGRENOR';
    brand.querySelector('.ts-kicker').textContent = 'EVERY SMALL BEGINNING';
    brand.querySelector('p').textContent = 'หนึ่งจุดเริ่มต้น · เส้นทางนับไม่ถ้วน';
    title.classList.add('ag-title');
    const menuTwins = document.createElement('div');
    menuTwins.className = 'ag-menu-twins';
    menuTwins.setAttribute('aria-hidden', 'true');
    menuTwins.innerHTML = `<svg viewBox="0 0 500 390" role="presentation">
      <defs><linearGradient id="agMenuRed" x2="1" y2="1"><stop stop-color="#df9368"/><stop offset="1" stop-color="#8b4240"/></linearGradient><linearGradient id="agMenuGreen" x2="1" y2="1"><stop stop-color="#a7b27c"/><stop offset="1" stop-color="#465a4b"/></linearGradient></defs>
      <ellipse cx="255" cy="359" rx="190" ry="17" fill="#222b24" opacity=".42"/>
      <g class="ag-menu-sister">
        <path d="M94 284Q96 218 123 172L156 150 197 164Q223 226 218 301L187 333H103Z" fill="url(#agMenuRed)" stroke="#452d31" stroke-width="5"/>
        <path d="M124 170L145 139 185 147 203 174 186 199 135 194Z" fill="#d9c6a5"/>
        <path d="M132 190L185 188 208 246 167 274 113 244Z" fill="#704a38" stroke="#d7b17c" stroke-width="4"/>
        <path d="M119 191L99 229 111 282M191 194L217 236 251 302" fill="none" stroke="#e8bd92" stroke-width="12" stroke-linecap="round"/>
        <path d="M134 288L127 350M185 288L193 350" stroke="#49352f" stroke-width="19" stroke-linecap="round"/>
        <path d="M119 354h19m45 0h19" stroke="#332d32" stroke-width="15" stroke-linecap="round"/>
        <ellipse cx="160" cy="120" rx="32" ry="39" fill="#eac49f"/>
        <path d="M128 121Q117 79 154 71Q193 67 198 108L184 119Q164 99 135 106Z" fill="#53392f"/>
        <path d="M132 92Q104 117 125 162L145 170 142 122M190 93Q220 117 198 161L181 169V117" fill="#56382f"/>
        <path d="M144 122h8m19 0h8" stroke="#40302d" stroke-width="4" stroke-linecap="round"/>
        <path d="M145 149q13 8 25 0" fill="none" stroke="#a86458" stroke-width="3"/>
        <path d="M154 155l10 0 6 13-12 9-13-9Z" fill="#d3a956"/>
      </g>
      <g class="ag-menu-brother">
        <path d="M267 281Q265 220 290 168L323 146 366 161Q394 226 385 303L354 334H275Z" fill="url(#agMenuGreen)" stroke="#34453e" stroke-width="5"/>
        <path d="M290 171L309 140 350 146 374 175 355 199 302 194Z" fill="#d9c6a5"/>
        <path d="M301 188L356 188 382 244 337 277 286 244Z" fill="#786044" stroke="#d7b17c" stroke-width="4"/>
        <path d="M290 192L270 230 251 302M363 193L392 233 384 267" fill="none" stroke="#e9c29d" stroke-width="12" stroke-linecap="round"/>
        <path d="M299 289L294 350M355 289L363 350" stroke="#49352f" stroke-width="19" stroke-linecap="round"/>
        <path d="M285 354h20m47 0h20" stroke="#332d32" stroke-width="15" stroke-linecap="round"/>
        <ellipse cx="332" cy="119" rx="33" ry="40" fill="#edc6a0"/>
        <path d="M299 112Q292 76 326 67Q362 61 378 93L391 111 369 123Q345 94 307 109Z" fill="#73452f"/>
        <path d="M305 84l-25 16 24 11m67-26 27 19-25 12" fill="#73452f"/>
        <path d="M316 121h8m21 0h8" stroke="#40302d" stroke-width="4" stroke-linecap="round"/>
        <path d="M320 148q13 8 25 0" fill="none" stroke="#a86458" stroke-width="3"/>
        <path d="M318 157h28l9 23-22 8-23-8Z" fill="#d3a956"/>
        <path d="M271 213q-28 17-28 42" fill="none" stroke="#e9c29d" stroke-width="11" stroke-linecap="round"/>
        <path d="M242 254l-15-9m15 9 2-17" stroke="#e9c29d" stroke-width="7" stroke-linecap="round"/>
      </g>
      <path d="M226 304q17-23 34 0l-2 34h-31Z" fill="#b69361" stroke="#493a32" stroke-width="4"/>
      <path d="M233 311h19m-19 9h19" stroke="#4a3d36" stroke-width="3"/>
    </svg>`;
    title.querySelector('.ts-veil')?.after(menuTwins);

    const replay = document.createElement('button');
    replay.className = 'ag-replay';
    replay.textContent = 'ดูบทเปิดอีกครั้ง';
    main.append(replay);

    const opening = document.createElement('section');
    opening.className = 'ag-story-opening';
    opening.hidden = true;
    opening.setAttribute('role', 'dialog');
    opening.setAttribute('aria-modal', 'true');
    opening.setAttribute('aria-label', 'บทเปิด: ครอบครัวและของฝากก่อนออกเดินทาง');
    opening.innerHTML = `
      <div class="ag-story-room" aria-hidden="true">
        <div class="ag-story-window"><i></i><i></i><i></i></div>
        <div class="ag-story-lamp"></div><div class="ag-story-table"></div>
      </div>
      <div class="ag-family-scene ag-scene">
        <span class="ag-story-label">II · บ้านที่รออยู่</span>
        <svg class="ag-family-art" viewBox="0 0 1000 620" role="presentation">
          <defs>
            <linearGradient id="agMomCoat" x2="0" y2="1"><stop stop-color="#a55b68"/><stop offset="1" stop-color="#673d50"/></linearGradient>
            <linearGradient id="agRedCape" x2="1" y2="1"><stop stop-color="#d4744e"/><stop offset="1" stop-color="#853b36"/></linearGradient>
            <linearGradient id="agGreenCape" x2="1" y2="1"><stop stop-color="#7c9a61"/><stop offset="1" stop-color="#3d594e"/></linearGradient>
          </defs>
          <ellipse cx="505" cy="560" rx="340" ry="25" fill="#211c24" opacity=".3"/>
          <g class="ag-family-mother">
            <path d="M380 548Q370 425 400 300L423 250H580L605 300Q632 430 618 548Z" fill="url(#agMomCoat)"/>
            <path d="M423 250Q500 285 580 250L559 335H440Z" fill="#ead9bd"/>
            <path d="M427 167Q430 105 500 99Q571 104 577 170L563 253Q500 291 437 251Z" fill="#7b4a39"/>
            <ellipse cx="502" cy="188" rx="55" ry="71" fill="#edc9a5"/>
            <path d="M446 180Q428 114 489 102Q551 83 568 136L558 174Q540 150 522 140Q489 162 446 160Z" fill="#51362f"/>
            <path d="M431 145Q500 90 570 143L564 163Q502 129 437 174Z" fill="#c59b72"/>
            <path d="M471 190h15m28 0h15" stroke="#49352f" stroke-width="5" stroke-linecap="round"/>
            <path d="M490 225q13 10 26 0" fill="none" stroke="#a86458" stroke-width="4" stroke-linecap="round"/>
            <path d="M405 329Q340 355 351 411L426 390M594 329Q658 350 647 411L575 390" fill="none" stroke="#edc9a5" stroke-width="24" stroke-linecap="round"/>
          </g>
          <g class="ag-family-sister">
            <path d="M180 550Q174 421 202 322L232 277H330L363 324Q383 429 372 550Z" fill="url(#agRedCape)"/>
            <path d="M234 281Q280 310 329 280L318 370H241Z" fill="#e6d5bd"/>
            <ellipse cx="282" cy="217" rx="50" ry="62" fill="#efc7a0"/>
            <path d="M231 216Q211 154 265 143Q321 129 335 184L321 213Q289 184 238 195Z" fill="#5a382f"/>
            <path d="M239 165Q198 193 219 258L245 270L250 206M325 164Q375 190 342 259L320 269L320 201" fill="#603b32"/>
            <path d="M268 218h12m18 0h12" stroke="#49352f" stroke-width="4" stroke-linecap="round"/>
            <path d="M271 244q11 8 22 0" fill="none" stroke="#a86458" stroke-width="3"/>
            <path d="M220 333Q178 351 199 394L251 385" fill="none" stroke="#efc7a0" stroke-width="20" stroke-linecap="round"/>
            <path d="M326 334Q359 348 379 379" fill="none" stroke="#efc7a0" stroke-width="20" stroke-linecap="round"/>
            <path d="M278 279l13 0 10 19-22 8-18-8Z" fill="#d7a64e"/>
          </g>
          <g class="ag-family-brother">
            <path d="M640 550Q629 424 661 319L691 273H791L824 322Q845 430 832 550Z" fill="url(#agGreenCape)"/>
            <path d="M692 279Q741 304 790 278L779 369H700Z" fill="#e1d5bc"/>
            <ellipse cx="741" cy="215" rx="52" ry="64" fill="#efc7a0"/>
            <path d="M689 207Q673 160 711 138Q746 115 782 142L805 174L783 208Q757 175 713 181Z" fill="#76442e"/>
            <path d="M700 159l-30 20 24 11m83-39 29 22-27 15" fill="#76442e"/>
            <path d="M716 216h12m25 0h12" stroke="#49352f" stroke-width="4" stroke-linecap="round"/>
            <path d="M727 242q12 8 24 0" fill="none" stroke="#a86458" stroke-width="3"/>
            <path d="M681 330Q640 349 622 383" fill="none" stroke="#efc7a0" stroke-width="20" stroke-linecap="round"/>
            <path d="M797 330Q826 343 815 387" fill="none" stroke="#efc7a0" stroke-width="20" stroke-linecap="round"/>
            <path d="M707 275h64l-16 34h-33Z" fill="#d7a64e"/>
          </g>
          <path class="ag-family-touch" d="M390 390Q347 360 313 367" fill="none" stroke="#edc9a5" stroke-width="18" stroke-linecap="round"/>
          <path d="M286 389Q306 398 323 380" fill="none" stroke="#edc9a5" stroke-width="15" stroke-linecap="round"/>
        </svg>
        <div class="ag-story-caption" aria-live="polite"></div>
      </div>
      <div class="ag-gift-scene ag-scene">
        <span class="ag-story-label">III · ของฝากก่อนเดินทาง</span>
        <svg class="ag-gift-art" viewBox="0 0 1000 620" role="presentation">
          <defs>
            <linearGradient id="agGiftWood" x2="0" y2="1"><stop stop-color="#956344"/><stop offset="1" stop-color="#50362f"/></linearGradient>
            <linearGradient id="agGiftBlade" x2="1" y2="1"><stop stop-color="#fff5d5"/><stop offset=".55" stop-color="#a8c3c6"/><stop offset="1" stop-color="#536c73"/></linearGradient>
            <radialGradient id="agGiftGlow"><stop stop-color="#fff0b0" stop-opacity=".85"/><stop offset="1" stop-color="#ffd46a" stop-opacity="0"/></radialGradient>
          </defs>
          <ellipse cx="500" cy="366" rx="370" ry="255" fill="url(#agGiftWood)" stroke="#d4ae73" stroke-width="8"/>
          <path d="M197 349Q498 288 804 354M231 430Q503 369 774 431M332 194Q502 246 671 187" fill="none" stroke="#d4a778" stroke-width="5" opacity=".25"/>
          <ellipse class="ag-gift-glow" cx="500" cy="316" rx="300" ry="210" fill="url(#agGiftGlow)"/>
          <g class="ag-gift-deck" transform="rotate(-8 493 331)">
            <rect x="395" y="214" width="220" height="254" rx="12" fill="#382737" stroke="#e5c27b" stroke-width="7"/>
            <rect x="411" y="230" width="188" height="222" rx="8" fill="#f2e4c4"/>
            <rect x="425" y="244" width="160" height="194" rx="5" fill="#304e50" stroke="#c5a15e" stroke-width="4"/>
            <path d="M505 274l37 54-37 77-37-77Z" fill="#dfbc70"/>
            <path d="M505 292l20 36-20 45-20-45Z" fill="#3c685f"/>
            <circle cx="505" cy="329" r="13" fill="#fff1bd"/>
            <path d="M459 271q46-34 92 0M459 398q46 34 92 0" fill="none" stroke="#e5c27b" stroke-width="3"/>
          </g>
          <g class="ag-gift-knife" transform="rotate(25 698 362)">
            <path d="M676 354L816 333Q840 333 829 350L708 397Z" fill="url(#agGiftBlade)" stroke="#e9ebd9" stroke-width="4"/>
            <path d="M630 366L690 349 706 393 648 411Z" fill="#704431" stroke="#d7ae70" stroke-width="5"/>
            <path d="M642 373l38-11m-30 30 37-11" stroke="#ddb978" stroke-width="5" stroke-linecap="round"/>
          </g>
          <g class="ag-gift-mother-hand">
            <path d="M-20 106Q140 100 255 170L390 247 354 317 217 259Q103 234-20 255Z" fill="#9d5662"/>
            <path d="M340 275Q376 254 400 272L451 309Q465 322 449 336L418 326Q440 349 420 363L391 348Q406 375 384 385L360 360Q368 392 347 397L323 364 294 321Z" fill="#edc6a0"/>
            <path d="M-20 110Q123 103 244 174" fill="none" stroke="#d99080" stroke-width="7" opacity=".6"/>
          </g>
          <g class="ag-gift-children-hand">
            <path d="M1020 514Q886 503 810 447L690 392 724 325 844 376Q932 398 1020 383Z" fill="#526f56"/>
            <path d="M734 359Q708 340 689 351L636 386Q619 399 637 414L670 400Q645 425 665 440L695 420Q678 451 702 462L726 436Q720 468 743 473L765 438 801 403Z" fill="#efc7a0"/>
            <path d="M1020 509Q901 497 821 444" fill="none" stroke="#96ae7c" stroke-width="7" opacity=".6"/>
          </g>
        </svg>
        <div class="ag-story-caption" aria-live="polite"></div>
      </div>
      <div class="ag-portal-scene ag-scene">
        <span class="ag-story-label">IV · ไพ่ใบแรก</span>
        <div class="ag-portal-backdrop"></div>
        <div class="ag-portal-card" aria-hidden="true"><div class="ag-portal-frame"><i>✦</i><b>AGRENOR</b><small>THE JOURNEY BEGINS</small></div></div>
        <div class="ag-portal-rings" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="ag-story-caption" aria-live="polite"></div>
      </div>
      <button class="ag-story-skip" type="button">ข้ามไปเมนู <span>ESC</span></button>
      <div class="ag-story-progress" aria-hidden="true"><i></i></div>`;
    title.append(opening);

    const scenes = [...opening.querySelectorAll('.ag-scene')];
    const skip = opening.querySelector('.ag-story-skip');
    const progress = opening.querySelector('.ag-story-progress i');
    const captions = scenes.map(scene => scene.querySelector('.ag-story-caption'));
    const duration = 8500;
    const chapter = opening.querySelector('.ag-story-label');
    let frame = 0, elapsed = 0, last = 0, active = false, ending = false, endTimer = 0;
    const captionsByScene = [
      ['แม่: เส้นทางข้างนอกกว้างไกล… แต่บ้านหลังนี้จะรอลูกเสมอ', 'พี่น้อง: เราจะกลับมาเล่าให้แม่ฟัง!'],
      ['แม่ฝากไว้: สำรับของพ่อ… และมีดเล่มนี้ จงใช้มันปกป้องกัน'],
      ['ไพ่ใบบนสุดเผยแสง — เรื่องราวบทใหม่กำลังเปิดออก']
    ];
    function showScene(index, line = 0) {
      opening.dataset.scene = String(index);
      scenes.forEach((scene, i) => scene.classList.toggle('is-current', i === index));
      chapter.textContent = ['II · บ้านที่รออยู่', 'III · ของฝากก่อนเดินทาง', 'IV · ไพ่ใบแรก'][index];
      captions.forEach((caption, i) => { caption.textContent = i === index ? captionsByScene[index][line] : ''; });
    }
    function restoreMenu() {
      opening.hidden = true;
      opening.classList.remove('is-ending');
      title.classList.remove('ag-story-playing');
      main.inert = false;
      main.removeAttribute('aria-hidden');
      (title.querySelector('[data-act="continue"]:not([disabled])') || title.querySelector('[data-act="new"]'))?.focus({ preventScroll: true });
    }
    function finish() {
      if (!active || ending) return;
      active = false;
      ending = true;
      cancelAnimationFrame(frame);
      opening.classList.add('is-ending');
      endTimer = window.setTimeout(restoreMenu, reduced.matches ? 0 : 850);
    }
    function tick(now) {
      if (!active) return;
      if (!document.hidden) elapsed += now - last;
      last = now;
      const index = elapsed < 4000 ? 0 : elapsed < 7000 ? 1 : 2;
      if (opening.dataset.scene !== String(index)) showScene(index);
      if (index === 0 && elapsed >= 2200 && opening.dataset.line !== '1') {
        opening.dataset.line = '1';
        showScene(0, 1);
      }
      progress.style.transform = `scaleX(${Math.min(1, elapsed / duration)})`;
      if (elapsed >= duration) finish();
      else frame = requestAnimationFrame(tick);
    }
    function play() {
      if (active || ending || !title.isConnected || reduced.matches) return;
      opening.hidden = false;
      opening.classList.remove('is-ending');
      opening.dataset.line = '0';
      title.classList.add('ag-story-playing');
      main.inert = true;
      main.setAttribute('aria-hidden', 'true');
      active = true;
      elapsed = 0;
      last = performance.now();
      showScene(0);
      progress.style.transform = 'scaleX(0)';
      skip.focus({ preventScroll: true });
      frame = requestAnimationFrame(tick);
    }
    function playAfterMakerLogo() {
      if (reduced.matches) return;
      window.addEventListener('maker-intro-finished', () => requestAnimationFrame(play), { once: true });
      window.MakerLogo?.play(title);
    }
    skip.onclick = finish;
    opening.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(); }
      if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
    });
    replay.onclick = playAfterMakerLogo;
    const visibilityChange = () => { last = performance.now(); };
    const motionChange = () => { if (reduced.matches) finish(); };
    document.addEventListener('visibilitychange', visibilityChange);
    reduced.addEventListener('change', motionChange);
    const observer = new MutationObserver((_, mutationObserver) => {
      if (!title.isConnected) {
        active = false;
        cancelAnimationFrame(frame);
        clearTimeout(endTimer);
        reduced.removeEventListener('change', motionChange);
        document.removeEventListener('visibilitychange', visibilityChange);
        mutationObserver.disconnect();
      }
    });
    observer.observe(document.body, { childList: true });
    playAfterMakerLogo();
  }
  if (document.readyState !== 'complete' && !document.getElementById('titleScreen')) document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
