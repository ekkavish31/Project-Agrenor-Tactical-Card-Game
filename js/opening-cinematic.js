/* Opening vignette: no save writes; original prologue and title actions stay intact. */
(() => {
  'use strict';
  function boot() {
    const title = document.getElementById('titleScreen');
    if (!title || !window.TitleScreen?.active || window.TitleScreen.newGame) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const main = title.querySelector('.ts-main');
    const brand = title.querySelector('.ts-brand');
    brand.querySelector('h1').textContent = 'AGRENOR';
    brand.querySelector('.ts-kicker').textContent = 'EVERY SMALL BEGINNING';
    brand.querySelector('p').textContent = 'หนึ่งจุดเริ่มต้น · เส้นทางนับไม่ถ้วน';
    title.classList.add('ag-title');
    const replay = document.createElement('button');
    replay.className = 'ag-replay'; replay.textContent = 'ดูบทเปิดอีกครั้ง';
    main.append(replay);
    const opening = document.createElement('section');
    opening.className = 'ag-opening'; opening.hidden = true;
    opening.setAttribute('role', 'dialog'); opening.setAttribute('aria-modal', 'true');
    opening.setAttribute('aria-label', 'บทเปิด ไพ่ใบเล็ก โลกใบใหญ่');
    const paths = [
      ['01', 'สร้าง', 'ด้วยสองมือ', 'assets/workshop.webp'],
      ['02', 'แลกเปลี่ยน', 'เชื่อมผู้คน', 'assets/market.webp'],
      ['03', 'ออกเดินทาง', 'ค้นพบสิ่งใหม่', 'assets/scenes/area-forest.webp'],
      ['04', 'เผชิญหน้า', 'เปลี่ยนชะตา', 'assets/scenes/area-ruins.webp']
    ];
    opening.innerHTML = `<div class="ag-world" aria-hidden="true"></div><div class="ag-haze" aria-hidden="true"></div>
      <div class="ag-orbit" aria-hidden="true"></div>
      <div class="ag-cards" aria-hidden="true">${paths.map(([n,label,sub,img],i)=>`<div class="ag-path ag-card" style="--i:${i};--x:${[-35,-12,12,35][i]}vw;--r:${[-15,-5,5,15][i]}deg"><img src="${img}" alt=""><span class="ag-card-no">${n} / POSSIBILITY</span><div class="ag-card-label">${label}<small>${sub}</small></div></div>`).join('')}
      <div class="ag-origin ag-card"><div class="ag-hero-art"></div><span class="ag-card-no">00 / THE BEGINNING</span><div class="ag-card-label">จุดเริ่มต้นเล็ก ๆ<small>เรื่องราวที่ยังไม่ได้เขียน</small></div></div></div>
      <div class="ag-dust" aria-hidden="true">${Array.from({length:16},(_,i)=>`<i style="--x:${(i*17)%100}%;--delay:${i*-.7}s"></i>`).join('')}</div>
      <div class="ag-caption"><span class="ag-chapter"></span><p aria-live="polite"></p></div>
      <div class="ag-reveal"><span>A WORLD OF POSSIBILITIES</span><h2>AGRENOR</h2><p>เรื่องราวของเจ้า… จะเป็นเช่นไร</p></div>
      <div class="ag-controls"><button class="ag-sound" aria-pressed="false">เสียง: ปิด</button><button class="ag-skip">ข้ามบทเปิด <span>ESC ↗</span></button></div><div class="ag-progress"><i></i></div>`;
    title.append(opening);
    let frame = 0, elapsed = 0, last = 0, stage = -1, active = false, sound = false, audio;
    const soundButton = opening.querySelector('.ag-sound');
    function chime(index) {
      if (!sound || !audio || audio.state !== 'running') return;
      [0, 7, 12].forEach((note,i) => {
        const osc=audio.createOscillator(), gain=audio.createGain(), t=audio.currentTime+i*.13;
        osc.type='sine'; osc.frequency.value=220*Math.pow(2,(note+index*2)/12);
        gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(.045,t+.08);
        gain.gain.exponentialRampToValueAtTime(.0001,t+1.2);
        osc.connect(gain).connect(audio.destination); osc.start(t); osc.stop(t+1.3);
      });
    }
    soundButton.onclick = async () => {
      try {
        audio ||= new (window.AudioContext || window.webkitAudioContext)();
        sound = !sound;
        if(sound) await audio.resume(); else await audio.suspend();
        soundButton.textContent=`เสียง: ${sound?'เปิด':'ปิด'}`;
        soundButton.setAttribute('aria-pressed', String(sound)); if(sound) chime(stage);
      } catch { sound=false; soundButton.textContent='อุปกรณ์นี้ไม่รองรับเสียง'; }
    };
    function finish() {
      if (!active) return;
      active=false; cancelAnimationFrame(frame); opening.hidden=true;
      main.inert=false; main.removeAttribute('aria-hidden');
      title.classList.remove('ag-playing');
      audio?.suspend().catch(()=>{});
      (title.querySelector('[data-act="continue"]:not([disabled])') || title.querySelector('[data-act="new"]')).focus({preventScroll:true});
    }
    const chapters = [
      ['I / A SMALL BEGINNING', 'จากจุดเริ่มต้นเล็ก ๆ'],
      ['II / MANY POSSIBLE LIVES', 'สองมือเดียวกัน… สร้างชีวิตได้หลายทาง'],
      ['III / A WIDER WORLD', 'ทุกเส้นทาง เป็นส่วนหนึ่งของโลกใบใหญ่'],
      ['IV / YOUR STORY', 'และทุกเรื่องราว… เริ่มต้นที่การเลือกของเจ้า'],
      ['', '']
    ];
    function tick(now) {
      if (!active) return;
      if (!document.hidden) elapsed += now-last;
      last=now;
      const next=elapsed<3000?0:elapsed<6500?1:elapsed<10000?2:elapsed<12500?3:4;
      if(next!==stage) {
        stage=next; opening.dataset.stage=String(stage);
        opening.querySelector('.ag-chapter').textContent=chapters[stage][0];
        opening.querySelector('.ag-caption p').textContent=chapters[stage][1]; chime(stage);
      }
      opening.querySelector('.ag-progress i').style.transform=`scaleX(${elapsed/15000})`;
      if(elapsed>=15000) finish(); else frame=requestAnimationFrame(tick);
    }
    function play() {
      if (active) return;
      opening.hidden=false; title.classList.add('ag-playing'); main.inert=true;
      main.setAttribute('aria-hidden','true'); active=true; stage=-1; elapsed=0;
      opening.dataset.stage='0'; opening.querySelector('.ag-skip').focus({preventScroll:true});
      if(reduced.matches) { finish(); return; }
      if(sound) audio?.resume().catch(()=>{});
      last=performance.now(); frame=requestAnimationFrame(tick);
    }
    opening.querySelector('.ag-skip').onclick=finish;
    opening.addEventListener('keydown',event=>{
      if(event.key==='Escape') {event.preventDefault();event.stopPropagation();finish();}
      if(event.key==='Tab') {
        const buttons=[soundButton,opening.querySelector('.ag-skip')];
        const i=buttons.indexOf(document.activeElement);
        event.preventDefault(); buttons[(i+(event.shiftKey?-1:1)+2)%2].focus();
      }
    });
    const visibilityChange=()=>{last=performance.now();};
    document.addEventListener('visibilitychange',visibilityChange);
    const motionChange=()=>{if(reduced.matches) finish();};
    reduced.addEventListener('change',motionChange);
    new MutationObserver((_,observer)=>{if(!title.isConnected){cancelAnimationFrame(frame);audio?.close().catch(()=>{});reduced.removeEventListener('change',motionChange);document.removeEventListener('visibilitychange',visibilityChange);observer.disconnect();}}).observe(document.body,{childList:true});
    replay.onclick=()=>window.MakerLogo?.play(title);
    // Decode in parallel; the vignette remains skippable while images load.
    for(const src of ['assets/intro/heroes-dawn.png','assets/intro/world-dawn.png']) {const image=new Image();image.src=src;}
    window.MakerLogo?.play(title);
  }
  if(document.readyState!=='complete' && !document.getElementById('titleScreen')) document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
