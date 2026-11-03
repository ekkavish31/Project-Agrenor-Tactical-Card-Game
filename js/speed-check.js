/* v98.14 · speed check — open  village-town.html?perf=1  on any machine (nothing to install), wait until the box says "เสร็จ", press "คัดลอกผล" and paste it.
   It reports: the machine (screen, cores, memory, graphics card, and whether the browser draws with the CPU instead of a GPU), how long the village froze while opening,
   frames per second while playing and what each big draw step costs per frame, and a 12-layer full-screen blend test in Canvas 2D (what the game uses today)
   and in WebGL, so we can tell whether WebGL would help on THAT machine. Nothing is sent anywhere. Without ?perf=1 this file does nothing. */
(function () {
  'use strict';
  /* the real game runs this page inside index.html's frame: ?perf=1 on the outer address counts too */
  const ON = /[?&]perf=1/.test(location.search) || (() => { try { return window.parent !== window && /[?&]perf=1/.test(parent.location.search) } catch (e) { return false } })();
  /* v98.98 · also started on demand by the "📊 วัดประสิทธิภาพ" button in Settings: SpeedCheck.start() (no ?perf=1 needed) */
  const VER = (() => { try { return new URL(document.currentScript.src).searchParams.get('v') } catch (e) { return null } })();   // the ?v= of this file = the game version that shipped it
  const lt = [];
  const watch = () => { try { new PerformanceObserver(l => { for (const e of l.getEntries()) lt.push([e.startTime, e.duration]) }).observe({ type: 'longtask', buffered: true }) } catch (e) { } };
  if (ON) watch();
  let running = false;
  /* v98.100 · live fps HUD: number + frame-time graph (bars: green ≤ 33 ms = 30 fps, amber ≤ 50 ms, red slower), drawn every frame while the check runs and until it is closed */
  let hud = null, hudOn = false;
  function hudStart() {
    if (hudOn) return; hudOn = true;
    const c = document.createElement('canvas'); c.width = 240; c.height = 96; c.style.cssText = 'position:fixed;right:12px;bottom:12px;left:auto;top:auto;width:240px;height:96px;max-width:240px;max-height:96px;z-index:99999;border-radius:10px;background:#000b;border:1px solid #b8943f;pointer-events:none'; document.body.append(c); hud = c;
    const g = c.getContext('2d'), N = 120, dts = []; let last = 0, acc = 0, cnt = 0, shown = 0, worst = 0, tt = 0;
    const loop = now => {
      if (!hudOn) { c.remove(); hud = null; return }
      if (last) { const d = now - last; dts.push(d); if (dts.length > N) dts.shift(); acc += d; cnt++; worst = Math.max(worst, d); if (acc >= 500) { shown = cnt * 1000 / acc; tt = worst; acc = cnt = worst = 0 } } last = now;
      g.clearRect(0, 0, 240, 96); const gy = ms => 96 - Math.min(ms, 66) / 66 * 62 - 2;
      dts.forEach((d, i) => { g.fillStyle = d <= 34 ? '#5fd38a' : d <= 50 ? '#e8b64a' : '#e5584a'; const y = gy(d); g.fillRect(i * 2, y, 1.6, 96 - 2 - y) });
      g.strokeStyle = '#fff6'; g.setLineDash([3, 3]); g.beginPath(); const y30 = gy(33.3), y60 = gy(16.7); g.moveTo(0, y30); g.lineTo(240, y30); g.moveTo(0, y60); g.lineTo(240, y60); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#fff9'; g.font = '9px system-ui'; g.fillText('30', 2, y30 - 2); g.fillText('60', 2, y60 - 2);
      g.fillStyle = shown >= 55 ? '#5fd38a' : shown >= 30 ? '#e8b64a' : '#e5584a'; g.font = 'bold 22px system-ui'; g.fillText(shown ? shown.toFixed(0) + ' fps' : '… fps', 22, 24); g.fillStyle = '#fffc'; g.font = '11px system-ui'; g.fillText('ช้าสุด ' + tt.toFixed(0) + ' ms', 120, 22);
      requestAnimationFrame(loop)
    };
    requestAnimationFrame(loop)
  }
  const hudStop = () => { hudOn = false };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let panel;
  function show(txt, done) {
    if (!panel) { panel = document.createElement('div'); panel.style.cssText = 'position:fixed;right:12px;left:auto;top:12px;z-index:99999;max-width:min(600px,94vw);max-height:92vh;overflow:auto;padding:12px 14px;border-radius:12px;background:#f3e6c6;color:#3a2a14;border:2px solid #b8943f;box-shadow:0 8px 24px #0006;font:13px/1.55 "Mali","Noto Sans Thai",system-ui,sans-serif'; document.body.append(panel) }
    panel.innerHTML = ''; const pre = document.createElement('pre'); pre.style.cssText = 'margin:0;white-space:pre-wrap;font:inherit'; pre.textContent = txt; panel.append(pre);
    if (done) {
      const b = document.createElement('button'); b.textContent = '📋 คัดลอกผล'; b.style.cssText = 'margin-top:8px;padding:6px 12px;border-radius:8px;border:1px solid #8a6a2a;background:#e8c46a;cursor:pointer;font:inherit;color:#3a2a14';
      b.onclick = async () => { try { await navigator.clipboard.writeText(txt); b.textContent = 'คัดลอกแล้ว ✓' } catch (e) { const r = document.createRange(); r.selectNodeContents(pre); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'เลือกข้อความแล้ว · กด Ctrl+C' } };
      panel.append(b);
      const x = document.createElement('button'); x.textContent = '✕ ปิด'; x.style.cssText = b.style.cssText + ';margin-left:8px'; x.onclick = () => { panel.remove(); panel = null; hudStop() }; panel.append(x)
    }
  }
  const px = () => ({ w: Math.max(2, Math.round(innerWidth * (window.devicePixelRatio || 1))), h: Math.max(2, Math.round(innerHeight * (window.devicePixelRatio || 1))) });
  function bench2d() {   // 12 full-screen blend layers like the day/night grade + bloom (read one pixel back so the work is really finished)
    const { w, h } = px(), c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#789'; g.fillRect(0, 0, w, h);
    const modes = ['multiply', 'soft-light', 'saturation', 'multiply']; const t = performance.now(), N = 12;
    for (let i = 0; i < N; i++) { g.globalCompositeOperation = modes[i % 4]; g.fillStyle = 'rgba(255,200,150,.5)'; g.fillRect(0, 0, w, h) }
    g.getImageData(0, 0, 1, 1); return (performance.now() - t) / N;
  }
  function benchGL() {
    const { w, h } = px(), c = document.createElement('canvas'); c.width = w; c.height = h;
    const gl = c.getContext('webgl', { antialias: false }); if (!gl) return null;
    let renderer = '?'; try { const x = gl.getExtension('WEBGL_debug_renderer_info'); renderer = x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) } catch (e) { }
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o }, pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}')); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision mediump float;void main(){gl_FragColor=vec4(1.,.78,.58,.5);}')); gl.linkProgram(pr); gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); const l = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.viewport(0, 0, w, h);
    const out = new Uint8Array(4), run = n => { const t = performance.now(); for (let i = 0; i < n; i++)gl.drawArrays(gl.TRIANGLES, 0, 3); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out); return (performance.now() - t) / n };
    run(2); return { ms: run(12), renderer };
  }
  const median = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  function sample(ms) {   // frames for `ms`, timing the big draw steps of the village
    return new Promise(res => {
      const T = {}, undo = [];
      const wrap = (o, n, label) => { const f = o && o[n]; if (typeof f !== 'function') return; o[n] = function (...a) { const t = performance.now(); try { return f.apply(this, a) } finally { T[label] = (T[label] || 0) + performance.now() - t } }; undo.push(() => { o[n] = f }) };
      /* v98.103 · inside drawSorted: time every object's own draw() (grouped by kind / id) so we can tell sorting+grouping from real drawing, and which things are expensive */
      const D = {}, N = { frames: 0, objs: 0 }, kindOf = it => (it.building || it.isBuilding ? 'อาคาร' : it.mobile ? 'ตัวละคร/NPC' : it.kind || it.type || 'อื่นๆ') + (it.id ? ':' + String(it.id).slice(0, 14) : '');
      const ds = window.drawSorted; if (typeof ds === 'function') { window.drawSorted = function (objects, ...r) { N.frames++; const arr = Array.isArray(objects) ? objects : [...objects]; N.objs += arr.length; const back = []; for (const it of arr) { if (it && typeof it.draw === 'function' && !Object.prototype.hasOwnProperty.call(it, '__d0')) { const f = it.draw, k = kindOf(it); try { it.__d0 = f; it.draw = function (...a) { const t = performance.now(); try { return f.apply(this, a) } finally { const e = D[k] || (D[k] = [0, 0]); e[0] += performance.now() - t; e[1]++ } }; back.push(it) } catch (e) { } } } try { return ds.call(this, arr, ...r) } finally { for (const it of back) { try { it.draw = it.__d0; delete it.__d0 } catch (e) { } } } }; undo.push(() => { window.drawSorted = ds }) }
      T.__D = D; T.__N = N;
      wrap(window, 'drawSorted', 'วาดวัตถุ'); wrap(window, 'edgeFade', 'ขอบจาง'); wrap(window.TownMood, 'grade', 'โทนสี/แสง'); wrap(window.HD2D, 'bloom', 'แสงฟุ้ง'); wrap(window.TownPaint, 'draw', 'พื้นที่ทาสี');
      let n = 0, hidden = false; const t0 = performance.now();
      /* v98.104 · whole-frame anatomy: JS time of every requestAnimationFrame callback, Chrome's long-animation-frame entries (script / style+layout / render share, top scripts)
         and the CSS effects on screen — to see where the ~80 ms of a frame goes when the draw steps above only add up to a few ms */
      const raf0 = window.requestAnimationFrame, cbT = { sum: 0, n: 0, by: {} }; let loaf = [], po = null;
      window.requestAnimationFrame = function (cb) { return raf0.call(window, function (ts) { const t0 = performance.now(); try { return cb(ts) } finally { const d = performance.now() - t0; cbT.sum += d; cbT.n++; const k = (cb.name || String(cb).replace(/\s+/g, ' ').slice(0, 44)); cbT.by[k] = (cbT.by[k] || 0) + d } }) }; undo.push(() => { window.requestAnimationFrame = raf0 });
      try { const PO = (window.parent !== window && (() => { try { return window.parent.PerformanceObserver } catch (e) { return null } })()) || PerformanceObserver; po = new PO(l => { for (const e of l.getEntries()) loaf.push(e) }); po.observe({ type: 'long-animation-frame', buffered: false }); undo.push(() => { try { po.disconnect() } catch (e) { } }) } catch (e) { }
      T.__A = { cbT, loaf: () => loaf };
      const dts = []; let last = 0;   // v98.98 · every frame time, to see stutter (min fps / 1% worst) and not only the average
      const f = now => { n++; if (last) dts.push(now - last); last = now; if (document.hidden) hidden = true; if (performance.now() - t0 > ms) { undo.forEach(u => u()); res({ n, hidden, T, dts, secs: (performance.now() - t0) / 1000 }) } else requestAnimationFrame(f) };
      requestAnimationFrame(f);
    });
  }
  async function main(manual) {
    if (running) return; running = true; if (manual) { watch(); hudStart() }
    // wait until the village has been painted and nothing heavy has run for 3 s (or 60 s at most)
    const t0 = performance.now();
    for (; ;) {
      const big = lt.filter(x => x[1] > 300), lastEnd = big.length ? Math.max(...big.map(x => x[0] + x[1])) : 0, d = window.__townDrawnAt || 0, now = performance.now();
      if (manual && (!('__townDrawnAt' in window) || d) && now - t0 > 600) break;   // started from Settings: the game is already running, no need to wait for it to open
      if (d && (now - Math.max(d, lastEnd) > 3000 || now - t0 > 90000)) break;   // never measure before the village has really been shown (it can sit hidden behind the title screen)
      show(d ? '⏱ ตรวจความเร็ว… รอให้เกมเปิดเสร็จ (' + Math.round(now / 1000) + ' วิ)\nอย่าสลับแท็บและอย่าขยับกล้องจนกว่าจะขึ้นว่า "เสร็จ"' : '⏱ ตรวจความเร็ว… รอเข้าหมู่บ้าน\nถ้ายังอยู่หน้าเมนูแรก กด "เล่นต่อ" หรือ "เริ่มเกมใหม่" ก่อน'); await wait(500);
    }
    show('⏱ กำลังวัด… (ประมาณ 10 วินาที) อย่าสลับแท็บ'); await wait(300);
    const b2 = median([bench2d(), bench2d(), bench2d()]); const gl = benchGL(); const glMs = gl ? median([benchGL().ms, gl.ms, benchGL().ms]) : null;
    const S = await sample(5000);
    const big = lt.filter(x => x[1] > 300), blocked = big.reduce((a, x) => a + x[1], 0) / 1000, lastEnd = (big.length ? Math.max(...big.map(x => x[0] + x[1])) : 0) / 1000, drawn = (window.__townDrawnAt || 0) / 1000;
    const dts = S.dts.slice().sort((a, b) => a - b), pct = q => dts.length ? dts[Math.min(dts.length - 1, Math.floor(dts.length * q))] : 0, worst = pct(0.99), jank = dts.filter(x => x > 50).length;
    /* v98.104 · experiments: the same fps with the CSS effects hidden, to see whether the compositor (not our JS) is the limit */
    const fxEls = []; { let n = 0; for (const el of document.querySelectorAll('*')) { if (++n > 4000) break; const cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 40 || r.bottom < 0 || r.top > innerHeight) continue; if ((cs.backdropFilter && cs.backdropFilter !== 'none') || (cs.mixBlendMode && cs.mixBlendMode !== 'normal') || (cs.filter && cs.filter !== 'none' && r.width > 300)) fxEls.push(el) } }
    let expTxt = 'ทดลอง: ';
    if (fxEls.length) { const old = fxEls.map(e => e.style.visibility); fxEls.forEach(e => e.style.visibility = 'hidden'); show('⏱ ทดลองปิดเอฟเฟกต์ CSS… (2 วิ)'); await wait(300); const E1 = await sample(2500); fxEls.forEach((e, i) => e.style.visibility = old[i]); expTxt += 'ซ่อนเอฟเฟกต์ CSS ' + fxEls.length + ' ชิ้น → ' + (E1.n / E1.secs).toFixed(1) + ' fps (ปกติ ' + (S.n / S.secs).toFixed(1) + ')' } else expTxt += 'ไม่มีเอฟเฟกต์ CSS ให้ซ่อน';
    const fps = S.n / S.secs, soft = gl ? /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(gl.renderer) : true;
    const D = S.T.__D || {}, NN = S.T.__N || {}, AN = S.T.__A; delete S.T.__D; delete S.T.__N; delete S.T.__A;
    const anatomy = (() => {
      const L = AN ? AN.loaf() : [], cb = AN ? AN.cbT : { sum: 0, n: 0 }, avg = f => L.length ? L.reduce((a, e) => a + f(e), 0) / L.length : 0, o = [];
      o.push('JS ใน requestAnimationFrame ทุกตัวรวมกัน: ' + (cb.n ? (cb.sum / S.n).toFixed(1) : '—') + ' ms/เฟรม (เฟรมจริง ' + (1000 / (S.n / S.secs)).toFixed(0) + ' ms) · แยกตามฟังก์ชัน: ' + Object.entries(cb.by || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ' ' + (v / S.n).toFixed(1)).join(' · '));
      if (L.length) {
        o.push('long-animation-frame ' + L.length + ' ครั้ง: นานเฉลี่ย ' + avg(e => e.duration).toFixed(0) + ' ms · สคริปต์ ' + avg(e => (e.scripts || []).reduce((a, s) => a + s.duration, 0)).toFixed(0) + ' ms · เริ่มเรนเดอร์หลัง ' + avg(e => e.renderStart ? e.renderStart - e.startTime : 0).toFixed(0) + ' ms · สไตล์+เลย์เอาต์ ' + avg(e => e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0).toFixed(0) + ' ms · บล็อก ' + avg(e => e.blockingDuration || 0).toFixed(0) + ' ms');
        const bySrc = new Map(); for (const e of L) for (const s of e.scripts || []) { const k = (s.invoker || s.type || '?') + ' ' + String(s.sourceURL || '').split('/').pop().split('?')[0] + ':' + (s.sourceFunctionName || ''); const r = bySrc.get(k) || [0, 0, 0]; r[0] += s.duration; r[1]++; r[2] += s.forcedStyleAndLayoutDuration || 0; bySrc.set(k, r) }
        const top = [...bySrc].sort((a, b) => b[1][0] - a[1][0]).slice(0, 6).map(([k, v]) => k + ' ' + (v[0] / L.length).toFixed(1) + 'ms' + (v[2] ? ' (บังคับเลย์เอาต์ ' + (v[2] / L.length).toFixed(1) + ')' : '')); if (top.length) o.push('   สคริปต์หนักสุด/เฟรมยาว: ' + top.join(' · '))
      } else o.push('long-animation-frame: ไม่มีข้อมูล (เบราว์เซอร์ไม่รองรับ หรือไม่มีเฟรมยาว)');
      const fx = []; let n = 0; for (const el of document.querySelectorAll('*')) { if (++n > 4000) break; const cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 40 || r.bottom < 0 || r.top > innerHeight) continue; const f = []; if (cs.backdropFilter && cs.backdropFilter !== 'none') f.push('backdrop-filter'); if (cs.filter && cs.filter !== 'none') f.push('filter:' + cs.filter.slice(0, 24)); if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') f.push('blend:' + cs.mixBlendMode); if (f.length) fx.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')) + ' ' + Math.round(r.width) + '×' + Math.round(r.height) + ' ' + f.join('+')) }
      o.push('เอฟเฟกต์ CSS บนจอ (ที่คอมโพสิตด้วย GPU): ' + (fx.length ? fx.slice(0, 8).join(' · ') + (fx.length > 8 ? ' … รวม ' + fx.length : '') : 'ไม่มี'));
      return o.join('\n');
    })();
    const parts = Object.entries(S.T).map(([k, v]) => [k, v / S.n]).sort((a, b) => b[1] - a[1]);
    const real = window.RENDER_STEP ? 'ขั้นความละเอียด ' + window.RENDER_STEP() : 'ความละเอียดเต็ม';
    const hints = [];
    if (S.hidden) hints.push('⚠ แท็บถูกซ่อนระหว่างวัด ตัวเลข fps ใช้ไม่ได้ ลองใหม่');
    if (!gl) hints.push('⚠ เบราว์เซอร์นี้เปิด WebGL ไม่ได้ → ไม่ควรใช้ WebGL กับเครื่องนี้');
    else if (soft) hints.push('⚠ เครื่องนี้วาดภาพด้วยซอฟต์แวร์ (ไม่มี GPU เร่ง) → WebGL ไม่ช่วย อาจช้าลง ต้องพึ่งการลดงาน/ลดความละเอียด');
    else if (glMs != null && b2 > 4 && b2 > glMs * 3) hints.push('✔ เอฟเฟกต์เต็มจอบน Canvas 2D ช้ากว่า WebGL มาก → ชั้นเอฟเฟกต์ WebGL น่าจะคุ้ม');
    else hints.push('○ เอฟเฟกต์เต็มจอบน Canvas 2D เร็วพอ → WebGL ไม่น่าจำเป็น');
    if (blocked > 6) hints.push('⚠ เกมค้างตอนเปิดนาน (' + blocked.toFixed(1) + ' วิ) → ควรอบพื้นหมู่บ้านล่วงหน้า (ไม่เกี่ยวกับ WebGL)');
    if (jank > dts.length * 0.05) hints.push('⚠ เฟรมกระตุกบ่อย (' + jank + ' เฟรมช้ากว่า 50 ms) → ดูรายการ "ใช้เวลาต่อเฟรม" ว่าขั้นไหนกินเวลาที่สุด');
    if (fps < 30) hints.push('⚠ ตอนเล่นต่ำกว่า 30 fps'); else if (fps >= 55) hints.push('✔ ตอนเล่นลื่น (≥55 fps)');
    const txt = [
      '== ตรวจความเร็ว · เกม ' + 'v' + (VER || '?') + ' · ' + new Date().toLocaleString('th-TH') + ' ==',
      'เบราว์เซอร์: ' + navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 150),
      'จอ: ' + screen.width + '×' + screen.height + ' · พื้นที่เกม ' + innerWidth + '×' + innerHeight + ' · อัตราพิกเซล ' + (window.devicePixelRatio || 1).toFixed(2) + ' (' + real + ')',
      'เครื่อง: ' + (navigator.hardwareConcurrency || '?') + ' คอร์ · RAM ~' + (navigator.deviceMemory || '?') + ' GB',
      'การ์ดจอ: ' + (gl ? gl.renderer : 'ไม่มี WebGL') + (soft ? '   ⚠ ซอฟต์แวร์' : ''),
      '',
      'เปิดเกม: วาดพื้นเสร็จที่ ' + drawn.toFixed(1) + ' วิ · เกมค้างรวม ' + blocked.toFixed(1) + ' วิ (' + big.length + ' ช่วง) · งานหนักสุดท้ายจบที่ ' + lastEnd.toFixed(1) + ' วิ',
      'ตอนเล่น: ' + fps.toFixed(1) + ' fps (' + (1000 / fps).toFixed(0) + ' ms ต่อเฟรม)',
      'ความกระตุก: เฟรมช้าสุด ' + (dts.length ? dts[dts.length - 1].toFixed(0) : '—') + ' ms · 1% ที่แย่สุด ≥ ' + worst.toFixed(0) + ' ms (≈' + (worst ? (1000 / worst).toFixed(0) : '—') + ' fps) · มัธยฐาน ' + pct(0.5).toFixed(1) + ' ms · เฟรมกระตุก (>50 ms) ' + jank + ' จาก ' + dts.length,
      'ฉาก: ' + scene() + ' · ' + extra(),
      (() => { const rows = Object.entries(D).map(([k, v]) => [k, v[0] / S.n, v[1] / S.n]).sort((a, b) => b[1] - a[1]), sum = rows.reduce((a, r) => a + r[1], 0), tot = (S.T['วาดวัตถุ'] || 0) / S.n; return 'ใน drawSorted: ทั้งหมด ' + tot.toFixed(1) + ' ms/เฟรม · วาดจริง (draw ของแต่ละชิ้น) ' + sum.toFixed(1) + ' ms · จัดกลุ่ม/เรียง/อื่นๆ ' + (tot - sum).toFixed(1) + ' ms · วัตถุที่ส่งมา ~' + (NN.frames ? Math.round(NN.objs / NN.frames) : '?') + ' ชิ้น/เฟรม\n   แพงสุด: ' + (rows.slice(0, 8).map(r => r[0] + ' ' + r[1].toFixed(1) + 'ms (' + r[2].toFixed(0) + ' ชิ้น)').join(' · ') || '—') })(),
      anatomy,
      expTxt,
      'ใช้เวลาต่อเฟรม (ms): ' + (parts.length ? parts.map(([k, v]) => k + ' ' + v.toFixed(1)).join(' · ') : '—'),
      'เอฟเฟกต์เต็มจอ 1 ชั้น: Canvas 2D ' + b2.toFixed(1) + ' ms · WebGL ' + (glMs == null ? '—' : glMs.toFixed(1) + ' ms'),
      '',
      'ข้อสังเกตอัตโนมัติ:', ...hints.map(h => ' ' + h),
      '', '✅ เสร็จ'
    ].join('\n');
    show(txt, true); running = false; try { console.log(txt) } catch (e) { }
  }
  function scene() { const p = location.pathname.split('/').pop() || 'index.html'; let s = p; try { if (window.TacticsCore || document.getElementById('tacticsLayer')?.classList.contains('fullbattle')) s += ' (มีฉากต่อสู้)' } catch (e) { } return s }
  function extra() {   // render settings that decide the cost of a frame
    const o = [], cv = [...document.querySelectorAll('canvas')].filter(c => c.width > 300).slice(0, 3).map(c => c.width + '×' + c.height);
    o.push('perf-lite ' + (document.documentElement.classList.contains('perf-lite') || document.body.classList.contains('perf-lite') ? 'เปิด' : 'ปิด')); if (cv.length) o.push('แคนวาส ' + cv.join(', '));
    try { if (performance.memory) o.push('หน่วยความจำ JS ' + (performance.memory.usedJSHeapSize / 1048576).toFixed(0) + '/' + (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0) + ' MB') } catch (e) { }
    try { if (window.RENDER_LOG) o.push('ปรับความละเอียด: ' + JSON.stringify(window.RENDER_LOG).slice(0, 160)) } catch (e) { }
    return o.join(' · ');
  }
  window.SpeedCheck = { start: () => { running = false; return main(true) }, running: () => running, hudOn: () => hudOn, stop: () => { if (panel) { panel.remove(); panel = null } hudStop() } };
  /* Ctrl+Shift+P anywhere in the game: start the check (press again after it finishes to close). The outer page hands it to the visible game frame (the village runs in one). */
  addEventListener('keydown', e => {
    if (!(e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p' || e.code === 'KeyP'))) return; e.preventDefault();
    if (window.parent !== window) return window.SpeedCheck.running() ? 0 : (window.SpeedCheck.hudOn() ? window.SpeedCheck.stop() : window.SpeedCheck.start());
    let t = null; for (const f of document.querySelectorAll('iframe')) { try { if (f.contentWindow.SpeedCheck && f.offsetParent !== null && f.getBoundingClientRect().width > 200) t = f.contentWindow } catch (x) { } }
    t = t || window; if (t.SpeedCheck.running()) return; t.SpeedCheck.hudOn() ? t.SpeedCheck.stop() : t.SpeedCheck.start()
  }, true);
  if (ON) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => main(false)); else main(false) }
})();
