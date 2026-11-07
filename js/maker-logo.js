/* Approved creator-supplied logo artwork and timing, isolated from game CSS.
   v98.172: prepare(title) builds the overlay + iframe hidden (opacity 0, no #makerIntro id) and decodes the artwork while the black
   "press any key" gate is showing; play(title) then only seeks to 0 and starts the clock, so nothing loads after the key press. */
(() => {
  let cleanup = null, pre = null;
  const reducedQuery = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function build(title) {
    const overlay = document.createElement('section');
    overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Aetheryn Studio');
    overlay.style.cssText='position:absolute;inset:0;z-index:20;background:#fafafa;opacity:0;pointer-events:none';
    const frame = document.createElement('iframe');
    frame.title='Aetheryn Studio · โลโก้ผู้สร้าง';
    frame.style.cssText='width:100%;height:100%;border:0;display:block;background:#fafafa;visibility:hidden';
    const skip = document.createElement('div'); skip.textContent='กด Esc หรือ X เพื่อข้าม';
    skip.style.cssText='position:absolute;right:20px;bottom:18px;color:#12304b99;font:13px/1.4 system-ui,sans-serif;letter-spacing:.04em;pointer-events:none;user-select:none';
    const state = { title, overlay, frame, skip, ready: null };
    state.ready = new Promise(resolve => {
      const giveUp = setTimeout(() => resolve(false), 12000);
      const done = ok => { clearTimeout(giveUp); resolve(ok); };
      frame.onload = async () => {
        try {
          const doc = frame.contentDocument;
          if (doc.URL === 'about:blank') return;
          // Decode the supplied embedded layers before the four-second clock can start.
          const images = [...doc.querySelectorAll('svg image')].map(el => new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = el.getAttribute('href'); }));
          await Promise.race([Promise.all(images), new Promise(r => setTimeout(r, 3000))]);
          if (!frame.contentWindow.logoPreview) return done(false);
          await frame.contentWindow.logoPreview.ready;
          frame.contentWindow.logoPreview.seek(0);
          done(true);
        } catch { done(false); }
      };
      frame.onerror = () => done(false);
    });
    frame.src='assets/maker/aetheryn-logo.html?embed=1&v=8';
    overlay.append(frame, skip); title.append(overlay);
    return state;
  }
  window.MakerLogo = {
    beforeOutro: null,
    prepare(title) {
      if (!title?.isConnected || reducedQuery()) return Promise.resolve(false);
      if (!pre || pre.title !== title || !pre.overlay.isConnected) pre = build(title);
      return pre.ready;
    },
    play(title) {
    if (!title?.isConnected || cleanup) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;
    const st = pre && pre.title === title && pre.overlay.isConnected ? pre : build(title);
    pre = null;
    const { overlay, frame, skip } = st;
    overlay.id='makerIntro'; overlay.style.opacity='1'; overlay.style.pointerEvents='';
    const main = title.querySelector('.ts-main');
    let raf=0, timeout=0, holdTimer=0, finished=false,cueIndex=0;
    const soundCues=[[1240,'bell'],[1360,'bell'],[1940,'sparkle'],[2700,'applause']];
    const inertBefore=main.inert;
    main.inert=true; title.classList.add('ag-playing');
    /* v98.173 · after the 4 s animation the final frame stays for 2 s (while the video finishes buffering, max +3 s), then finish(true)
       keeps the logo underneath so the video overlay can fade in over it; Esc/X still skips at once (finish()). */
    function hold(){
      if(holdTimer||finished)return;
      const gate=Promise.resolve(window.MakerLogo?.beforeOutro?.()).catch(()=>{});
      holdTimer=setTimeout(()=>{Promise.race([gate,new Promise(r=>setTimeout(r,3000))]).then(()=>finish(true))},2000);
    }
    function finish(natural) {
      if(finished)return;finished=true;cancelAnimationFrame(raf);clearTimeout(timeout);clearTimeout(holdTimer);
      window.removeEventListener('message',message);document.removeEventListener('keydown',keydown,true);reduced.removeEventListener('change',motion);
      if(natural===true){overlay.removeAttribute('id');skip.style.opacity='0';setTimeout(()=>overlay.remove(),1500);}else overlay.remove();
      window.dispatchEvent(new Event('maker-intro-finished'));main.inert=inertBefore;title.classList.remove('ag-playing');cleanup=null;
      (main.querySelector('[data-act="continue"]:not([disabled])')||main.querySelector('[data-act="new"]'))?.focus({preventScroll:true});
    }
    function message(e){if(e.source===frame.contentWindow&&e.origin===location.origin&&e.data?.type==='maker-skip')finish();}
    function keydown(e){if(e.repeat)return;if(e.key==='Escape'||e.key==='x'||e.key==='X'){e.preventDefault();e.stopPropagation();finish();}}
    function motion(){if(reduced.matches)finish();}
    function tick(){
      if(finished)return;
      if(!title.isConnected){finish();return;}
      const time=frame.contentWindow?.logoPreview?.time||0;
      while(cueIndex<soundCues.length&&time>=soundCues[cueIndex][0])window.GameBGM?.playIntroSfx(soundCues[cueIndex++][1]);
      if(time>=4000)hold();else raf=requestAnimationFrame(tick);
    }
    document.addEventListener('keydown',keydown,true);window.addEventListener('message',message);reduced.addEventListener('change',motion);
    st.ready.then(ok=>{
      if(finished)return;
      if(!ok||!frame.contentWindow?.logoPreview){finish();return;}
      try{
        frame.contentWindow.logoPreview.seek(0);
        clearTimeout(timeout);frame.style.visibility='visible';
        frame.contentDocument.getElementById('play').click();raf=requestAnimationFrame(tick);
      }catch{finish();}
    });
    cleanup=finish;
    timeout=setTimeout(finish,12000);
  } };
})();
