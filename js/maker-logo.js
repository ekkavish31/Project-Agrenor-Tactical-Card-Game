/* Approved creator-supplied logo artwork and timing, isolated from game CSS. */
(() => {
  let cleanup = null;
  window.MakerLogo = { play(title) {
    if (!title?.isConnected || cleanup) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;
    const main = title.querySelector('.ts-main');
    const overlay = document.createElement('section');
    overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Aetheryn Studio'); overlay.id='makerIntro';
    overlay.style.cssText='position:absolute;inset:0;z-index:20;background:#fafafa;opacity:1';
    const frame = document.createElement('iframe');
    frame.title='Aetheryn Studio · โลโก้ผู้สร้าง';
    frame.style.cssText='width:100%;height:100%;border:0;display:block;background:#fafafa;visibility:hidden';
    const skip = document.createElement('div'); skip.textContent='กด Esc หรือ X เพื่อข้าม';
    skip.style.cssText='position:absolute;right:20px;bottom:18px;color:#12304b99;font:13px/1.4 system-ui,sans-serif;letter-spacing:.04em;pointer-events:none;user-select:none';
    let raf=0, timeout=0, finished=false,cueIndex=0;
    const soundCues=[[1240,'bell'],[1360,'bell'],[1940,'sparkle'],[2700,'applause']];
    const inertBefore=main.inert;
    main.inert=true; title.classList.add('ag-playing');
    function finish() {
      if(finished)return;finished=true;cancelAnimationFrame(raf);clearTimeout(timeout);
      window.removeEventListener('message',message);document.removeEventListener('keydown',keydown,true);reduced.removeEventListener('change',motion);
      overlay.remove();window.dispatchEvent(new Event('maker-intro-finished'));main.inert=inertBefore;title.classList.remove('ag-playing');cleanup=null;
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
      overlay.style.opacity=String(Math.max(0,Math.min(1,(4000-time)/500)));
      if(time>=4000)finish();else raf=requestAnimationFrame(tick);
    }
    document.addEventListener('keydown',keydown,true);window.addEventListener('message',message);reduced.addEventListener('change',motion);
    frame.onload=async()=>{
      try {
        const doc=frame.contentDocument;
        if(doc.URL==='about:blank')return;
        // Decode the supplied embedded layers before starting the four-second clock.
        const images=[...doc.querySelectorAll('svg image')].map(el=>new Promise(resolve=>{const im=new Image();im.onload=im.onerror=resolve;im.src=el.getAttribute('href');}));
        await Promise.race([Promise.all(images),new Promise(r=>setTimeout(r,3000))]);
        if(finished)return;
        if(!frame.contentWindow.logoPreview){finish();return;}
        await frame.contentWindow.logoPreview.ready;
        if(finished)return;
        frame.contentWindow.logoPreview.seek(0);
        clearTimeout(timeout);frame.style.visibility='visible';
        frame.contentDocument.getElementById('play').click();raf=requestAnimationFrame(tick);
      }catch{finish();}
    };
    frame.onerror=finish;cleanup=finish;
    frame.src='assets/maker/aetheryn-logo.html?embed=1&v=6';
    overlay.append(frame,skip);title.append(overlay);
    timeout=setTimeout(finish,12000);
  }};
})();
