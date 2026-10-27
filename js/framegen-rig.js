/* v91.43 · 3D Frame Generator — auto humanoid rig, pose presets and extra "special" bone chains (cloth / hair / tail).
   Assumes a T-pose character that stands on y=0, is centred on x/z and faces +Z (glTF convention).
   All maths is done on the model's own vertices, no network. Character's right hand = -X (seen from the camera at +Z). */
(function () {
  'use strict';
  const FR = {};
  const DEF = { armY: null, shoulderX: .15, elbowT: .5, hipY: null, hipX: .075, kneeT: .5, neckOff: .045, ARMDOWN: 1.15 };
  FR.defaults = () => ({ ...DEF });

  /* ---- analysis: find arm height / span from the vertices ---- */
  FR.analyze = function (pos, H) {
    let maxX = 0;
    for (let i = 0; i < pos.length; i += 3) { const y = pos[i + 1]; if (y > .35 * H && y < .95 * H) maxX = Math.max(maxX, Math.abs(pos[i])) }
    const ys = [];
    for (let i = 0; i < pos.length; i += 3) { if (Math.abs(pos[i]) > .72 * maxX && pos[i + 1] > .35 * H) ys.push(pos[i + 1]) }
    ys.sort((a, b) => a - b);
    const armY = ys.length ? ys[ys.length >> 1] : .75 * H;
    return { maxX, armY };
  };

  /* guess which way the model faces by comparing the feet (toes stick out forward) with the shins: returns yaw (deg) to add so it faces +Z */
  FR.guessFront = function (pos, H) {
    let fx = 0, fz = 0, fn = 0, lx = 0, lz = 0, ln = 0;
    for (let i = 0; i < pos.length; i += 3) {
      const y = pos[i + 1];
      if (y < .06 * H) { fx += pos[i]; fz += pos[i + 2]; fn++ } else if (y > .1 * H && y < .3 * H) { lx += pos[i]; lz += pos[i + 2]; ln++ }
    }
    if (!fn || !ln) return 0;
    const dx = fx / fn - lx / ln, dz = fz / fn - lz / ln;
    if (Math.abs(dx) > Math.abs(dz) * 1.3) return dx > 0 ? -90 : 90;   // toes point to +X / -X
    return dz >= 0 ? 0 : 180;
  };

  const V = (x, y, z) => ({ x, y, z });
  function joints(H, p, an) {
    const armY = p.armY * H, hipY = p.hipY * H, maxX = an.maxX, shX = p.shoulderX * H, hx = p.hipX * H, ankle = .05 * H, kneeY = ankle + (hipY - ankle) * (1 - p.kneeT), neckY = armY + p.neckOff * H;
    const J = {
      hips: V(0, hipY, 0), spine: V(0, hipY + (armY - hipY) * .38, 0), chest: V(0, hipY + (armY - hipY) * .72, 0), neck: V(0, neckY, 0), head: V(0, neckY + .02 * H, 0), top: V(0, H, 0)
    };
    for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
      const sp = Math.max(.05 * H, maxX - shX);
      J['shoulder' + n] = V(s * shX, armY, 0); J['elbow' + n] = V(s * (shX + sp * p.elbowT), armY, 0); J['wrist' + n] = V(s * (shX + sp * .82), armY, 0); J['tip' + n] = V(s * maxX, armY, 0);
      J['hip' + n] = V(s * hx, hipY, 0); J['knee' + n] = V(s * hx, kneeY, 0); J['ankle' + n] = V(s * hx, ankle, 0); J['toe' + n] = V(s * hx, .018 * H, .08 * H);
    }
    return J;
  }
  /* bone table: name, parent, joint it sits at, and the weight segments [A,B] it owns */
  function table(J) {
    const t = [
      ['hips', null, 'hips', [['hips', 'spine'], ['hips', 'hipL'], ['hips', 'hipR']]],
      ['spine', 'hips', 'spine', [['spine', 'chest']]],
      ['chest', 'spine', 'chest', [['chest', 'neck'], ['chest', 'shoulderL'], ['chest', 'shoulderR']]],
      ['neck', 'chest', 'neck', [['neck', 'head']]],
      ['head', 'neck', 'head', [['head', 'top']]]
    ];
    for (const n of ['L', 'R']) {
      t.push(['upperArm' + n, 'chest', 'shoulder' + n, [['shoulder' + n, 'elbow' + n]]], ['foreArm' + n, 'upperArm' + n, 'elbow' + n, [['elbow' + n, 'wrist' + n]]], ['hand' + n, 'foreArm' + n, 'wrist' + n, [['wrist' + n, 'tip' + n]]],
        ['thigh' + n, 'hips', 'hip' + n, [['hip' + n, 'knee' + n]]], ['shin' + n, 'thigh' + n, 'knee' + n, [['knee' + n, 'ankle' + n]]], ['foot' + n, 'shin' + n, 'ankle' + n, [['ankle' + n, 'toe' + n]]]);
    }
    return t;
  }

  function segDist(px, py, pz, a, b) {
    const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z, apx = px - a.x, apy = py - a.y, apz = pz - a.z, l2 = abx * abx + aby * aby + abz * abz || 1e-9;
    let t = (apx * abx + apy * aby + apz * abz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /* chain: {name, attach:[x,y,z], n, len, radius, motion, amp, speed, delay, sweep} */
  function chainPoints(c) { const pts = []; for (let i = 0; i <= c.n; i++) pts.push(V(c.attach[0], c.attach[1] - c.len * i / c.n, c.attach[2])); return pts }

  /* build everything: returns a rig that owns a SkinnedMesh made from `srcMesh` (geometry baked into `root` space) */
  function rootBoneUpdate(b) { b.updateMatrixWorld(true) }
  FR.build = function (THREE, root, srcMeshes, H, params, chains, onProgress) {
    const p = { ...DEF, ...params }, srcs = srcMeshes;
    // merge geometry data (only position/normal/uv/index of each mesh are kept; baked to root space)
    const geos = srcs.map(m => { m.updateWorldMatrix(true, false); const g = m.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(m.matrixWorld)); return g });
    const meshOf = geos.map((g, i) => ({ g, m: srcs[i] }));
    const an = FR.analyze(geos[0].attributes.position.array, H);
    if (p.armY == null) p.armY = an.armY / H;
    if (p.hipY == null) p.hipY = Math.min(.5, p.armY * .62);
    const J = joints(H, p, an), T = table(J);
    const chainList = (chains || []).map(c => ({ ...c, pts: chainPoints(c) }));

    // skeleton
    const bones = {}, list = [];
    const mk = (name, parent, at) => { const b = new THREE.Bone(); b.name = name; b.position.set(at.x - (parent ? parent.__at.x : 0), at.y - (parent ? parent.__at.y : 0), at.z - (parent ? parent.__at.z : 0)); b.__at = at; b.__rest = b.position.clone(); if (parent) parent.add(b); bones[name] = b; list.push(b); return b };
    for (const [name, par, jn] of T) mk(name, par ? bones[par] : null, J[jn]);
    // body weight segments
    const segs = []; T.forEach(([name, , , ss], bi) => { for (const [a, b] of ss) segs.push({ bi, a: J[a], b: J[b] }) });
    // chain bones: parent = nearest body bone to the attach point
    const nBody = list.length;
    chainList.forEach(c => {
      const A = V(...c.attach); let best = 0, bd = 1e9; for (const s of segs) { const d = segDist(A.x, A.y, A.z, s.a, s.b); if (d < bd) { bd = d; best = s.bi } }
      let prev = list[best]; c.bones = [];
      c.pts.forEach((pt, i) => { const b = mk('chain:' + c.name + ':' + i, prev, pt); c.bones.push(list.length - 1); prev = b }); c.parentBone = best;
    });

    // weights
    const out = [], EPS = .004 * H;
    for (const { g } of meshOf) {
      const pa = g.attributes.position.array, n = pa.length / 3, idx = new Uint16Array(n * 4), wt = new Float32Array(n * 4), S = segs.length, tmpW = new Float32Array(S);
      const bw = new Float32Array(nBody);
      for (let v = 0; v < n; v++) {
        const x = pa[v * 3], y = pa[v * 3 + 1], z = pa[v * 3 + 2];
        bw.fill(0);
        for (let s = 0; s < S; s++) { const d = segDist(x, y, z, segs[s].a, segs[s].b) + EPS; const w = 1 / (d * d * d * d); if (w > bw[segs[s].bi]) bw[segs[s].bi] = w }
        // top 4 body bones
        let i0 = 0, i1 = 1, i2 = 2, i3 = 3; const top = [[-1, 0], [-1, 0], [-1, 0], [-1, 0]];
        for (let b = 0; b < nBody; b++) { const w = bw[b]; if (w > top[3][1]) { top[3] = [b, w]; for (let k = 3; k > 0 && top[k][1] > top[k - 1][1]; k--) { const t = top[k]; top[k] = top[k - 1]; top[k - 1] = t } } }
        const sum = top[0][1] + top[1][1] + top[2][1] + top[3][1] || 1;
        let cw = 0, cb = -1, cf = 0, cc = null;
        for (const c of chainList) {
          let bd = 1e9, bt = 0;
          for (let i = 0; i < c.n; i++) { const a = c.pts[i], b = c.pts[i + 1], abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z, l2 = abx * abx + aby * aby + abz * abz || 1e-9; let t = ((x - a.x) * abx + (y - a.y) * aby + (z - a.z) * abz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const dx = x - a.x - abx * t, dy = y - a.y - aby * t, dz = z - a.z - abz * t, d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d < bd) { bd = d; bt = i + t } }
          const R = c.radius, r0 = .4 * R; let rf = bd <= r0 ? 1 : bd >= R ? 0 : (() => { const q = (bd - r0) / (R - r0); return 1 - q * q * (3 - 2 * q) })();
          const q = Math.min(1, bt / 1.2), ramp = q * q * (3 - 2 * q), w = rf * ramp;
          if (w > cw) { cw = w; cc = c; cb = Math.min(c.n - 1, Math.floor(bt)); cf = bt - cb }
        }
        const o = v * 4;
        if (cw > .01 && cc) {
          const a = top[0], b = top[1], s2 = a[1] + b[1] || 1, k = 1 - cw;
          idx[o] = a[0] < 0 ? 0 : a[0]; wt[o] = k * a[1] / s2 * (a[0] < 0 ? 0 : 1); idx[o + 1] = b[0] < 0 ? 0 : b[0]; wt[o + 1] = k * b[1] / s2 * (b[0] < 0 ? 0 : 1);
          idx[o + 2] = cc.bones[cb]; wt[o + 2] = cw * (1 - cf); idx[o + 3] = cc.bones[Math.min(cc.n, cb + 1)]; wt[o + 3] = cw * cf;
          const ws = wt[o] + wt[o + 1] + wt[o + 2] + wt[o + 3] || 1; for (let k2 = 0; k2 < 4; k2++) wt[o + k2] /= ws;
        } else {
          for (let k = 0; k < 4; k++) { idx[o + k] = top[k][0] < 0 ? 0 : top[k][0]; wt[o + k] = top[k][0] < 0 ? 0 : top[k][1] / sum }
        }
      }
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(idx, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(wt, 4));
      out.push(g);
      if (onProgress) onProgress(1);
    }

    // meshes
    const group = new THREE.Group(); group.name = 'rigged';
    rootBoneUpdate(list[0]);
    const skeleton = new THREE.Skeleton(list), meshes = [];
    const rootBone = list[0];
    meshOf.forEach(({ g, m }, k) => {
      const sm = new THREE.SkinnedMesh(g, m.userData.origMat || m.material);
      sm.frustumCulled = false; sm.name = 'skinned' + k; group.add(sm); meshes.push(sm);
    });
    group.add(rootBone); group.updateMatrixWorld(true);
    meshes.forEach(sm => sm.bind(skeleton, new THREE.Matrix4()));

    const rig = { group, bones, list, meshes, J, params: p, chains: chainList, skeleton, nBody, H, analysis: an, bonesHelper: null };

    /* ---- poses ---- */
    const AD = p.ARMDOWN, TAU = Math.PI * 2, ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
    const clamp01 = x => Math.max(0, Math.min(1, x));
    function reset() { for (const b of list) { b.rotation.set(0, 0, 0); b.position.copy(b.__rest) } for (const n of ['L', 'R']) { const s = n === 'L' ? 1 : -1; bones['upperArm' + n].rotation.z = -s * AD } bones.hips.rotation.order = 'XYZ'; for (const b of list) b.rotation.order = 'XYZ' }
    const P = {
      idle: t => { const s = Math.sin(TAU * t), c = Math.cos(TAU * t); bones.chest.rotation.x = .035 * s; bones.spine.rotation.x = .015 * s; bones.head.rotation.x = -.02 * s; for (const n of ['L', 'R']) { const k = n === 'L' ? 1 : -1; bones['upperArm' + n].rotation.z += -k * .03 * s; bones['foreArm' + n].rotation.x = -.12 - .02 * c } bones.hips.position.y = bones.hips.__rest.y - .004 * H * (1 - Math.cos(TAU * t)) },
      walk: (t, a = 1) => { const s = Math.sin(TAU * t), c = Math.cos(TAU * t);
        bones.thighL.rotation.x = -.6 * a * s; bones.thighR.rotation.x = .6 * a * s; bones.shinL.rotation.x = .9 * a * Math.max(0, c); bones.shinR.rotation.x = .9 * a * Math.max(0, -c); bones.footL.rotation.x = -.2 * a * Math.max(0, c); bones.footR.rotation.x = -.2 * a * Math.max(0, -c);
        bones.upperArmL.rotation.x = .5 * a * s; bones.upperArmR.rotation.x = -.5 * a * s; bones.foreArmL.rotation.x = -.25 * a - .25 * a * Math.max(0, -s); bones.foreArmR.rotation.x = -.25 * a - .25 * a * Math.max(0, s);
        bones.spine.rotation.y = .1 * a * s; bones.chest.rotation.y = .08 * a * s; bones.head.rotation.y = -.1 * a * s; bones.hips.position.y = bones.hips.__rest.y - .018 * H * a * (.5 + .5 * Math.cos(4 * Math.PI * t)); bones.hips.rotation.y = -.08 * a * s },
      run: t => { P.walk(t, 1.6); bones.spine.rotation.x = .22; bones.chest.rotation.x = .08; bones.head.rotation.x = -.15; bones.foreArmL.rotation.x -= .6; bones.foreArmR.rotation.x -= .6; bones.hips.position.y -= .01 * H * (.5 + .5 * Math.cos(4 * Math.PI * t)) },
      attack: t => { // right hand (−X side) slashes
        const w = ease(t / .32), st = ease((t - .32) / .16), rc = ease((t - .6) / .4), k = (1 - rc);
        const arm = bones.upperArmR, fore = bones.foreArmR;
        arm.rotation.x = (2.3 * w - 4.0 * st + 1.7 * 0) * k; if (t > .48) arm.rotation.x = -1.7 * k; arm.rotation.z = (AD - 1.1 * w * k);
        fore.rotation.x = -.4 * w * k - .2 * st * k;
        bones.spine.rotation.y = (-.5 * w + .95 * st) * k; bones.chest.rotation.y = (-.3 * w + .5 * st) * k; bones.spine.rotation.x = (-.18 * w + .45 * st) * k; bones.head.rotation.y = (.2 * w - .4 * st) * k;
        bones.upperArmL.rotation.x = .5 * st * k; bones.thighL.rotation.x = -.45 * st * k; bones.thighR.rotation.x = .3 * st * k; bones.shinL.rotation.x = .35 * st * k; bones.shinR.rotation.x = .3 * st * k; bones.hips.position.y = bones.hips.__rest.y - .03 * H * st * k },
      cast: t => { const up = ease(t / .3) * (1 - ease((t - .8) / .2)), pulse = .06 * Math.sin(TAU * t * 2) * up;
        for (const n of ['L', 'R']) { const k = n === 'L' ? 1 : -1; bones['upperArm' + n].rotation.x = (-1.45 + pulse) * up; bones['upperArm' + n].rotation.z = -k * AD * (1 - .55 * up); bones['foreArm' + n].rotation.x = -.35 * up }
        bones.chest.rotation.x = -.12 * up; bones.head.rotation.x = -.18 * up; bones.spine.rotation.x = -.05 * up; bones.hips.position.y = bones.hips.__rest.y + .008 * H * Math.sin(TAU * t * 2) * up },
      hurt: t => { const p2 = Math.sin(Math.PI * clamp01(t)), q = p2 * p2 * (1.5 - .5 * p2); bones.spine.rotation.x = -.45 * q; bones.chest.rotation.x = -.2 * q; bones.head.rotation.x = -.35 * q; for (const n of ['L', 'R']) { bones['upperArm' + n].rotation.x = .9 * q; bones['foreArm' + n].rotation.x = -.5 * q } bones.thighL.rotation.x = -.25 * q; bones.thighR.rotation.x = .3 * q; bones.shinL.rotation.x = .5 * q; bones.shinR.rotation.x = .4 * q; bones.hips.position.y = bones.hips.__rest.y - .04 * H * q; bones.hips.position.z = bones.hips.__rest.z - .03 * H * q }
    };
    rig.actions = { idle: 'ยืนหายใจ', walk: 'เดิน', run: 'วิ่ง', attack: 'ฟัน/โจมตี', cast: 'ร่ายเวท', hurt: 'โดนตี' };
    rig.pose = function (action, t) {
      reset(); (P[action] || P.idle)(t);
      for (const c of chainList) {
        const A = c.amp ?? .35, sp = Math.max(1, Math.round(c.speed ?? 1)), dl = c.delay ?? .12, sw = c.sweep ?? .12, mo = c.motion || 'flutter';
        const moving = action === 'run' ? 1.6 : action === 'walk' ? 1 : 0, lean = bones.spine.rotation.x;
        c.bones.forEach((bi, i) => {
          if (i === 0) return; const b = list[bi], f = i / c.n, ph = TAU * (sp * t - dl * i);
          let rz = 0, rx = 0;
          if (mo === 'flutter') { rz = A * Math.sin(ph) * (.4 + .6 * f); rx = .5 * A * Math.sin(ph + 1.6) * (.4 + .6 * f) }
          else if (mo === 'sway') { rz = A * Math.sin(ph) * .6; rx = .15 * A * Math.sin(ph * 2) }
          else if (mo === 'spring') { rx = A * (Math.sin(ph) * .5) - lean * .8; rz = .3 * A * Math.sin(ph + 1) }
          rx += sw * (1 + moving * .8) * (.5 + .5 * f);
          b.rotation.x = rx; b.rotation.z = rz;
        });
      }
      group.updateMatrixWorld(true);
    };
    rig.tpose = function () { for (const b of list) { b.rotation.set(0, 0, 0); b.position.copy(b.__rest) } group.updateMatrixWorld(true) };
    rig.setHelper = function (on) {
      if (rig.bonesHelper) { group.remove(rig.bonesHelper); rig.bonesHelper.geometry.dispose(); rig.bonesHelper = null }
      if (!on) return;
      const g = new THREE.BufferGeometry(), m = new THREE.LineBasicMaterial({ color: 0x35f0ff, depthTest: false, transparent: true });
      const l = new THREE.LineSegments(g, m); l.renderOrder = 999; l.frustumCulled = false; l.userData.helper = true; group.add(l); rig.bonesHelper = l;
      rig.updateHelper = () => { const pts = []; const v = new THREE.Vector3(); for (const b of list) { if (b.parent && b.parent.isBone) { b.parent.getWorldPosition(v); pts.push(v.x, v.y, v.z); b.getWorldPosition(v); pts.push(v.x, v.y, v.z) } } g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)) };
      rig.updateHelper();
    };
    rig.dispose = () => { rig.setHelper(false); for (const g of out) g.dispose() };
    reset(); group.updateMatrixWorld(true);
    return rig;
  };
  window.FrameRig = FR;
})();
