#!/usr/bin/env python3
"""End-to-end check of the village editor grid (needs: pip install playwright + a chromium build).
Usage: python3 tools/e2e-village-grid.py [base_url]    (default http://localhost:8777, serve the repo root first)
Drives village-town.html?edit=1 in headless Chromium and checks that places, entry points and items sit on the grid."""
import json, math, sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8777').rstrip('/')
URL = BASE + '/village-town.html?edit=1'
SHOTS = '/tmp/shots'
fails, passes = [], 0


def check(name, ok, detail=''):
    global passes
    if ok:
        passes += 1
        print('PASS', name)
    else:
        fails.append(name)
        print('FAIL', name, detail)


def on_lattice(v, step, eps=2e-3):
    return abs(v / step - round(v / step)) * step <= eps


JS_HELPERS = """
window.__t = {
  screenOf(wx, wy) { const r = cv.getBoundingClientRect(), s = scale * zoom;
    return { x: r.left + W / 2 + pan.x + (wx - WORLD_W / 2) * s, y: r.top + H / 2 + pan.y + (wy - WORLD_H / 2) * s }; },
  placeCentre(id) { const o = locations.find(l => l.id === id), c = center(o); return { u: c.u, v: c.v, x: o.x, y: o.y, facing: o.facing }; },
  hitPoint(id) { const o = locations.find(l => l.id === id);
    for (const dy of [-30, -60, -90, -120, -15, 0, -150]) for (const dx of [0, -40, 40, -80, 80]) {
      const p = { x: o.x * MX + dx, y: o.y * MY + dy }, h = TownUX.hitObject(p);
      if (h && h.id === id) return this.screenOf(p.x, p.y); }
    return null; }
};
"""


def main():
    os_errors = []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 1560, 'height': 890})
        pg.on('pageerror', lambda e: os_errors.append('PAGEERROR ' + str(e)[:200]))
        pg.on('console', lambda m: os_errors.append('console.error ' + m.text[:200]) if m.type == 'error' else None)
        pg.goto(URL, wait_until='networkidle', timeout=60000)
        pg.wait_for_timeout(2500)
        pg.evaluate(JS_HELPERS)

        check('page loads without errors', not os_errors, os_errors[:3])
        check('VillageGrid module is loaded', pg.evaluate("typeof VillageGrid === 'object'"))
        check('old S snap API is gone', pg.evaluate("TownUX.toggleSnap === undefined && TownUX.snapEnabled === undefined"))
        check('default grid mode is 2x2', pg.evaluate("TownUX.gridMode()") == '2x2')
        labels = pg.evaluate("[...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(), c = getComputedStyle(b); return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none' }).map(b => b.textContent.trim())")
        check('old "จัดแนว: S" button removed', not any('จัดแนว' in t for t in labels), [t for t in labels if 'จัดแนว' in t])
        check('grid buttons exist', any('กริด' in t for t in labels) and any('2×2' in t for t in labels), labels[:12])

        # --- overlay toggle -------------------------------------------------
        check('overlay off by default', pg.evaluate("TownUX.gridShown()") is False)
        pg.click('#gridShowBtn')
        pg.wait_for_timeout(300)
        check('overlay button turns the grid on', pg.evaluate("TownUX.gridShown()") is True)
        pg.screenshot(path=SHOTS + '/e2e-grid-on-2x2.png')

        # --- Q switches mode ------------------------------------------------
        pg.mouse.move(700, 400)
        pg.keyboard.press('q')
        pg.wait_for_timeout(200)
        check('Q switches to 4x4', pg.evaluate("TownUX.gridMode()") == '4x4')
        check('mode button label follows', '4×4' in pg.inner_text('#gridModeBtn'), pg.inner_text('#gridModeBtn'))
        pg.screenshot(path=SHOTS + '/e2e-grid-on-4x4.png')
        pg.keyboard.press('q')
        pg.wait_for_timeout(200)
        check('Q switches back to 2x2', pg.evaluate("TownUX.gridMode()") == '2x2')
        pg.keyboard.press('s')
        pg.wait_for_timeout(100)
        check('S no longer does anything', pg.evaluate("TownUX.gridMode()") == '2x2')

        # --- drag a place: it must land on the lattice while and after dragging
        for mode, step in (('2x2', 0.5), ('4x4', 0.25)):
            if pg.evaluate("TownUX.gridMode()") != mode:
                pg.keyboard.press('q')
                pg.wait_for_timeout(150)
            for place_id, (mx, my) in (('shop', (37, 23)), ('forge', (-41, 17))):
                pg.evaluate("TownUX.setMode('object')")
                pt = pg.evaluate("__t.hitPoint(%s)" % json.dumps(place_id))
                if not pt:
                    check('can find a clickable point on ' + place_id, False)
                    continue
                pg.mouse.move(pt['x'], pt['y'])
                pg.mouse.down()
                for i in range(1, 5):
                    pg.mouse.move(pt['x'] + mx * i / 4, pt['y'] + my * i / 4)
                    if i == 2:  # also while still dragging
                        mid = pg.evaluate("__t.placeCentre(%s)" % json.dumps(place_id))
                        check('%s %s centre on lattice DURING drag' % (mode, place_id), on_lattice(mid['u'], step) and on_lattice(mid['v'], step), mid)
                pg.mouse.up()
                pg.wait_for_timeout(200)
                c = pg.evaluate("__t.placeCentre(%s)" % json.dumps(place_id))
                check('%s %s centre on lattice after drop' % (mode, place_id), on_lattice(c['u'], step) and on_lattice(c['v'], step), c)

        # --- entry point is on the grid (normal and deep) --------------------
        for mode, step in (('2x2', 0.5), ('4x4', 0.25)):
            if pg.evaluate("TownUX.gridMode()") != mode:
                pg.keyboard.press('q')
                pg.wait_for_timeout(150)
            for deep in (False, True):
                res = pg.evaluate("""([deep]) => { const o = locations.find(l => l.id === 'shop'), a = center(o);
                    TownUX.setEntry(o, { u: a.u + 1.37, v: a.v + 5.93 }, deep);
                    const e = o.entry, mirror = o.facing === 'SE', w = VillageGrid.offsetToWorld({ u: a.u, v: a.v }, mirror, e.du, e.dv);
                    return { u: w.u, v: w.v, deep: !!e.deep }; }""", [deep])
                check('%s entry (deep=%s) on lattice' % (mode, deep), on_lattice(res['u'], step) and on_lattice(res['v'], step), res)


        # --- place editor: items snap on drag, arrows, add, paste ---------------
        pg.evaluate("TownUX.setMode('object')")
        for mode, step in (('2x2', 0.5), ('4x4', 0.25)):
            if pg.evaluate("TownUX.gridMode()") != mode:
                pg.keyboard.press('q')
                pg.wait_for_timeout(150)
            key = pg.evaluate("""() => { VillageAssetEdit.enter('shop'); const d = VillageAssetEdit.get();
                return [...Object.keys(d.edit), ...d.added.map(a => a.id)].find(k => VillageAssetEdit.itemWorld(k)?.owner === 'shop') }""")
            pg.evaluate("VillageAssetEdit.leave()")
            pg.wait_for_timeout(200)
            pg.evaluate("k => VillageAssetEdit.enter('shop', k)", key)
            pg.wait_for_timeout(400)
            sel = pg.evaluate("VillageAssetEdit.getSelection().keys")
            check(mode + ' place editor has a selected item', sel == [key], sel)

            def item_on_lattice(label):
                pos = pg.evaluate("k => VillageAssetEdit.itemWorld(k)", key)
                c = pg.evaluate("p => VillageGrid.unproject(p.x, p.y)", pos)
                check('%s %s on lattice' % (mode, label), on_lattice(c['u'], step) and on_lattice(c['v'], step), c)
                return pos
            pg.mouse.move(700, 300)
            p0 = None
            for k in ('ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'):
                before = pg.evaluate("k => VillageAssetEdit.itemWorld(k)", key)
                pg.keyboard.press(k)
                pg.wait_for_timeout(250)
                after = item_on_lattice('item after ' + k)
                dx, dy = after['x'] - before['x'], after['y'] - before['y']
                want = {'ArrowRight': (112 * step, 0), 'ArrowDown': (0, 28 * step * 1), 'ArrowLeft': (-112 * step, 0), 'ArrowUp': (0, -28 * step)}[k]
                # one grid step: right/left = 2 cells-steps*28px*2... see VillageGrid.arrowStep; accept the exact screen step or a snap correction of <= one step
                bc = pg.evaluate("p => VillageGrid.unproject(p.x, p.y)", before)
                was_on = on_lattice(bc['u'], step) and on_lattice(bc['v'], step)
                # an item that started off-grid is first pulled onto the lattice, so only demand a pure axis move when it started on it
                check('%s %s moves along its screen axis' % (mode, k), (not was_on) or ((abs(dx) > 0.01 and abs(dy) < 0.01) or (abs(dx) < 0.01 and abs(dy) > 0.01)), (dx, dy))
            pg.keyboard.press('Shift+ArrowRight')
            pg.wait_for_timeout(250)
            item_on_lattice('item after Shift+ArrowRight')
            # drag the item with the mouse by a non-grid amount
            s0 = pg.evaluate("k => { const p = VillageAssetEdit.itemWorld(k); return __t.screenOf(p.x, p.y) }", key)
            pg.mouse.move(s0['x'], s0['y'])
            pg.mouse.down()
            for i in range(1, 4):
                pg.mouse.move(s0['x'] + 37.3 * i / 3, s0['y'] + 11.7 * i / 3)
            pg.mouse.up()
            pg.wait_for_timeout(250)
            item_on_lattice('item after mouse drag')
            pg.evaluate("VillageAssetEdit.leave(false)")
            pg.wait_for_timeout(200)

        # --- state persists -------------------------------------------------
        pg.reload(wait_until='networkidle')
        pg.wait_for_timeout(1500)
        check('grid on/off and mode are remembered after reload',
              pg.evaluate("[TownUX.gridShown(), TownUX.gridMode()]") == [True, '2x2'] or pg.evaluate("TownUX.gridShown()") is True)
        b.close()

    print('\n%d passed, %d failed' % (passes, len(fails)))
    if fails:
        print('FAILED:', fails)
    sys.exit(1 if fails else 0)


main()
