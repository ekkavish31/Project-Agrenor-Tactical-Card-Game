/* v98.14 · speed check — open  village-town.html?perf=1  on any machine (nothing to install), wait until the box says "เสร็จ", press "คัดลอกผล" and paste it.
   It reports: the machine (screen, cores, memory, graphics card, and whether the browser draws with the CPU instead of a GPU), how long the village froze while opening,
   frames per second while playing and what each big draw step costs per frame, and a 12-layer full-screen blend test in Canvas 2D (what the game uses today)
   and in WebGL, so we can tell whether WebGL would help on THAT machine. Nothing is sent anywhere. Without ?perf=1 this file does nothing. */
(function () {
  'use strict';
  if (!/[?&]perf=1/.test(location.search)) return;
  const VER = (() => { try { return new URL(document.currentScript.src).searchParams.get('v') } catch (e) { return null } })();   // the ?v= of this file = the game version that shipped it
  const lt = [];
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) lt.push([e.startTime, e.duration]) }).observe({ type: 'longtask', buffered: true }) } catch (e) { }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let panel;
  function show(txt, done) {
    if (!panel) { panel = document.createElement('div'); panel.style.cssText = 'position:fixed;left:12px;top:12px;z-index:99999;max-width:min(600px,94vw);max-height:92vh;overflow:auto;padding:12px 14px;border-radius:12px;background:#f3e6c6;color:#3a2a14;border:2px solid #b8943f;box-shadow:0 8px 24px #0006;font:13px/1.55 "Mali","Noto Sans Thai",system-ui,sans-serif'; document.body.append(panel) }
    panel.innerHTML = ''; const pre = document.createElement('pre'); pre.style.cssText = 'margin:0;white-space:pre-wrap;font:inherit'; pre.textContent = txt; panel.append(pre);
    if (done) {
      const b = document.createElement('button'); b.textContent = '📋 คัดลอกผล'; b.style.cssText = 'margin-top:8px;padding:6px 12px;border-radius:8px;border:1px solid #8a6a2a;background:#e8c46a;cursor:pointer;font:inherit;color:#3a2a14';
      b.onclick = async () => { try { await navigator.clipboard.writeText(txt); b.textContent = 'คัดลอกแล้ว ✓' } catch (e) { const r = document.createRange(); r.selectNodeContents(pre); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'เลือกข้อความแล้ว · กด Ctrl+C' } };
      panel.append(b)
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
      wrap(window, 'drawSorted', 'วาดวัตถุ'); wrap(window, 'edgeFade', 'ขอบจาง'); wrap(window.TownMood, 'grade', 'โทนสี/แสง'); wrap(window.HD2D, 'bloom', 'แสงฟุ้ง'); wrap(window.TownPaint, 'draw', 'พื้นที่ทาสี');
      let n = 0, hidden = false; const t0 = performance.now();
      const f = () => { n++; if (document.hidden) hidden = true; if (performance.now() - t0 > ms) { undo.forEach(u => u()); res({ n, hidden, T, secs: (performance.now() - t0) / 1000 }) } else requestAnimationFrame(f) };
      requestAnimationFrame(f);
    });
  }
  async function main() {
    // wait until the village has been painted and nothing heavy has run for 3 s (or 60 s at most)
    const t0 = performance.now();
    for (; ;) {
      const big = lt.filter(x => x[1] > 300), lastEnd = big.length ? Math.max(...big.map(x => x[0] + x[1])) : 0, d = window.__townDrawnAt || 0, now = performance.now();
      if ((d && now - Math.max(d, lastEnd) > 3000) || now - t0 > 60000) break;
      show('⏱ ตรวจความเร็ว… รอให้เกมเปิดเสร็จ (' + Math.round(now / 1000) + ' วิ)\nอย่าสลับแท็บและอย่าขยับกล้องจนกว่าจะขึ้นว่า "เสร็จ"'); await wait(500);
    }
    show('⏱ กำลังวัด… (ประมาณ 10 วินาที) อย่าสลับแท็บ'); await wait(300);
    const b2 = median([bench2d(), bench2d(), bench2d()]); const gl = benchGL(); const glMs = gl ? median([benchGL().ms, gl.ms, benchGL().ms]) : null;
    const S = await sample(5000);
    const big = lt.filter(x => x[1] > 300), blocked = big.reduce((a, x) => a + x[1], 0) / 1000, lastEnd = (big.length ? Math.max(...big.map(x => x[0] + x[1])) : 0) / 1000, drawn = (window.__townDrawnAt || 0) / 1000;
    const fps = S.n / S.secs, soft = gl ? /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(gl.renderer) : true;
    const parts = Object.entries(S.T).map(([k, v]) => [k, v / S.n]).sort((a, b) => b[1] - a[1]);
    const real = window.RENDER_STEP ? 'ขั้นความละเอียด ' + window.RENDER_STEP() : 'ความละเอียดเต็ม';
    const hints = [];
    if (S.hidden) hints.push('⚠ แท็บถูกซ่อนระหว่างวัด ตัวเลข fps ใช้ไม่ได้ ลองใหม่');
    if (!gl) hints.push('⚠ เบราว์เซอร์นี้เปิด WebGL ไม่ได้ → ไม่ควรใช้ WebGL กับเครื่องนี้');
    else if (soft) hints.push('⚠ เครื่องนี้วาดภาพด้วยซอฟต์แวร์ (ไม่มี GPU เร่ง) → WebGL ไม่ช่วย อาจช้าลง ต้องพึ่งการลดงาน/ลดความละเอียด');
    else if (glMs != null && b2 > 4 && b2 > glMs * 3) hints.push('✔ เอฟเฟกต์เต็มจอบน Canvas 2D ช้ากว่า WebGL มาก → ชั้นเอฟเฟกต์ WebGL น่าจะคุ้ม');
    else hints.push('○ เอฟเฟกต์เต็มจอบน Canvas 2D เร็วพอ → WebGL ไม่น่าจำเป็น');
    if (blocked > 6) hints.push('⚠ เกมค้างตอนเปิดนาน (' + blocked.toFixed(1) + ' วิ) → ควรอบพื้นหมู่บ้านล่วงหน้า (ไม่เกี่ยวกับ WebGL)');
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
      'ใช้เวลาต่อเฟรม (ms): ' + (parts.length ? parts.map(([k, v]) => k + ' ' + v.toFixed(1)).join(' · ') : '—'),
      'เอฟเฟกต์เต็มจอ 1 ชั้น: Canvas 2D ' + b2.toFixed(1) + ' ms · WebGL ' + (glMs == null ? '—' : glMs.toFixed(1) + ' ms'),
      '',
      'ข้อสังเกตอัตโนมัติ:', ...hints.map(h => ' ' + h),
      '', '✅ เสร็จ'
    ].join('\n');
    show(txt, true); try { console.log(txt) } catch (e) { }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main); else main();
})();
