"""Build asset-manifest.json / asset-manifest.js — the single list of every image the game uses,
including frames, code-drawn placeholders and art that does not exist yet.
Run from the game folder:  python tools/build-asset-manifest.py
Existing statuses/prompts in asset-manifest.json are kept (so Asset Studio exports are not overwritten)."""
import json, os, re, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

STYLE = {
 'card':   'Landscape 7:5 fantasy RPG card illustration (the card window crops nothing important: keep the subject centred with margin), warm amber lighting, detailed painterly realistic fantasy game art, dark forest green/brown backdrop, one large readable central subject, no people unless stated, no text, no border, no symbols.',
 'item':   'Fantasy RPG item illustration, painterly realistic, warm amber light, dark forest-green background, one large readable object centered, no text, no border.',
 'ui':     'Square game UI button illustration, one large central object, hand-painted fantasy RPG, dark forest-green background, warm amber lighting, aged brass, readable at 48px, no people, no text, no outer border.',
 'scene':  'Wide 16:9 hand-painted fantasy RPG location background, warm cosy lighting, detailed painterly style, empty floor area in the lower middle for characters to stand, no people, no text.',
 'hero':   'Same chibi/SD anime adventurer boy as the reference image (brown messy hair, amber eyes, white shirt, brown vest, green cape), full body, clean cel-shaded game sprite, consistent proportions and scale with the reference, feet at the bottom centre, nothing cropped.',
 'sprite': 'Clean cel-shaded fantasy game sprite matching the reference art style, full object visible, centred, nothing cropped.',
 'enemy':  'Clean cel-shaded fantasy game enemy sprite matching the scarecrow reference style, full body, feet at the bottom centre, facing down-left (3/4 view), nothing cropped.',
}
GREEN = ' Background: perfectly flat pure green (#00FF00), no shadow on the background, no gradient — it will be removed.'

# Known subjects (from ASSET-PROMPTS.md and the game code).
SUBJECT = {
 'item-iron':'three cold silver iron ingots','item-coal':'a small sack of chunky black coal','item-wood':'three split wooden logs tied with rope','item-food':'bread, cheese and dried meat wrapped in cloth',
 'action-cancel':'tongs setting an unfinished iron blank into a salvage tray, spent ash behind','action-auto':'a mechanical hammer over a glowing ingot, furnace and quenching bucket',
 'action-buy':'a market stall counter with ingots, coal and food for sale','action-sell':'a merchant weighing a finished sword against coins','action-orders':'a village notice board with pinned order slips',
 'action-chest':'an open wooden storage chest with ingots and tools','action-deck':'a fan of ornate adventure cards on a wooden desk','action-recipes':'an open blacksmith recipe book with sword and hammer diagrams',
 'wip-hot':'a glowing orange hot iron ingot on a dark anvil','wip-shaped':'an unfinished partly hammered steel billet on an anvil',
 'smelt':'molten iron pouring from a crucible in a roaring furnace','forge':'a hammer striking a glowing ingot on an anvil with sparks','water':'hot steel quenched in a wooden barrel with steam',
 'breath':'a young adventurer sitting on a rock catching his breath under a blue sky','meal':'a warm bowl of stew and bread at a camp table','camp':'a tent and campfire in a forest clearing at dusk',
 'sleep':'a young adventurer asleep under a patchwork quilt in a cosy bed','recovery':'a quiet forest camp with tea and a bedroll, meditative calm','armor-burn':'red-hot glowing armour plates with heat cracks',
 'hammer-strike':'a heavy smith hammer smashing into steel with a burst of sparks','water-ball':'a swirling ball of blue water magic',
 'sword':'a finished iron sword lying on a dark cloth','hammer':'a finished smith hammer lying on a dark cloth',
 'workshop':'a forest-edge blacksmith workshop interior with furnace on the left, anvil, quench barrel and an open door to the forest on the right',
 'home':'a cosy wooden cottage interior with a bed on the left, a chest in the middle and a writing desk on the right','market':'a village market square with stalls and a notice board',
}
CATS = [
 ('scenes','ฉากหลัง'),('village-map','แผนที่หมู่บ้าน'),('cards','ภาพในการ์ดหมู่บ้าน'),('tactic-cards','ภาพการ์ดสนามตาราง'),('items','ไอเทมและอุปกรณ์'),
 ('actions','ปุ่มกิจกรรม'),('ui','ไอคอน UI / HUD'),('characters','ตัวละคร (ภาพนิ่ง)'),('hero-frames','เฟรมอนิเมชันฮีโร่ (หมู่บ้าน)'),
 ('tactics-hero','ฮีโร่สนามตาราง (ทิศ × ท่า)'),('tactics-equipment','อุปกรณ์สนามตาราง'),('tactics-props','สิ่งกีดขวางสนามตาราง'),('enemies','ศัตรู'),('allies','เพื่อนร่วมทีม'),('cursors','เคอร์เซอร์'),('textures','พื้นผิว'),('terrain','พื้นสนาม'),('ui-packs','ไอคอนชุด / กรอบการ์ด'),('elements','ไอคอนธาตุ')]

def size_of(path):
    try:
        with Image.open(path) as im: return list(im.size), im.mode in ('RGBA','LA','P')
    except Exception: return None, None

def entry(id_, file, cat, status, subject, style, transparent=None, target=None, **extra):
    s, alpha = size_of(file) if file and os.path.exists(file) else (None, None)
    tr = transparent if transparent is not None else bool(alpha)
    prompt = STYLE[style] + ' Subject: ' + subject + '.' + (GREEN if tr else '')
    e = {'id': id_, 'file': file, 'category': cat, 'status': status, 'size': target or s, 'transparent': tr, 'subject': subject, 'prompt': prompt}
    e.update({k: v for k, v in extra.items() if v is not None})
    return e

items = []
def add(e): items.append(e)

# --- loose art in assets/ ---
for f in sorted(glob.glob('assets/*.webp')):
    n = os.path.splitext(os.path.basename(f))[0]
    if n in ('workshop','home','market'): add(entry('scene-'+n, f, 'scenes', 'final', SUBJECT[n], 'scene', False, usedIn='ฉาก'+{'workshop':'โรงตีเหล็ก','home':'บ้าน','market':'ตลาด'}[n]))
    elif n.startswith('item-'): add(entry(n, f, 'items', 'final', SUBJECT.get(n,n), 'item', False, usedIn='การ์ดไอเทมในกระเป๋า'))
    elif n.startswith('action-'): add(entry(n, f, 'actions', 'final', SUBJECT.get(n,n), 'card', False, usedIn='ปุ่มกิจกรรม'))
    elif n.startswith('ui-'): add(entry(n, f, 'ui', 'final', n[3:]+' icon', 'ui', False, usedIn='ปุ่มเมนูด้านบน'))
    elif n.startswith('wip-') or n in ('sword','hammer'): add(entry(n, f, 'items', 'final', SUBJECT.get(n,n), 'item', False, usedIn='การ์ดชิ้นงาน/อุปกรณ์'))
    elif n.startswith(('adventurer-','hero','scarecrow')) or n=='freshness-faces':
        st = 'final'
        add(entry('char-'+n, f, 'characters', st, n.replace('-',' '), 'hero' if not n.startswith('scarecrow') else 'enemy', None, usedIn='ตัวละครในฉาก/การ์ด'))
    else:
        note = 'ภาพต้นฉบับเสีย (แถบดำล่าง) ตัดออกแล้ว ควรเจนใหม่' if n=='recovery' else None
        add(entry('card-'+n, f, 'cards', 'temp' if n=='recovery' else 'final', SUBJECT.get(n,n), 'card', False, usedIn='ภาพในการ์ด', note=note))
for f in sorted(glob.glob('assets/v03/*')):
    n = os.path.splitext(os.path.basename(f))[0]
    if n=='village-map': add(entry('village-map', f, 'village-map', 'final', 'top-down illustrated fantasy village map with houses, market, smithy, fountain square, temple and roads leading out in six directions', 'scene', False, usedIn='แผนที่หมู่บ้าน'))
    elif n.startswith('hud'): add(entry('ui-'+n, f, 'ui', 'final', 'flat 2D HUD glyph sheet (heart, stamina bolt, coin, faces)', 'ui', None, usedIn='HUD ด้านบน', note='เป็น atlas หลายช่องในภาพเดียว ต้องคงตำแหน่งช่องเดิม'))
    else: add(entry('tex-'+n, f, 'textures', 'final', 'ivory paper texture, seamless', 'ui', False, usedIn='พื้นหลัง UI'))
for f in sorted(glob.glob('assets/cursor-*.png')):
    n = os.path.splitext(os.path.basename(f))[0]
    add(entry(n, f, 'cursors', 'final', 'fantasy pointer cursor', 'sprite', True, usedIn='เคอร์เซอร์เมาส์' if 'source' not in n else 'ไฟล์ต้นฉบับ (ไม่ได้ใช้ในเกม)'))

# --- hero animation frames (village) ---
src = open('js/animation-data.js', encoding='utf8').read()
data = json.loads(src[src.index('{', src.index('HERO_ANIMATIONS')):src.rindex('}')+1])
extra = json.load(open('assets/characters/hero/extra/clips.json', encoding='utf8')) if os.path.exists('assets/characters/hero/extra/clips.json') else {}   # v97.61: the old 2D-scene hero frames were deleted
clips = {**data['clips'], **extra}
for clip, c in clips.items():
    for i, fr in enumerate(c['frames']):
        f = fr['src']; m = re.search(r'_(\d\d)(?:_([a-z]+))?\.webp$', f)
        phase = (m.group(2) if m and m.group(2) else 'frame')
        add(entry('frame-'+os.path.splitext(os.path.basename(f))[0], f, 'hero-frames', 'final',
                  f"animation clip '{clip}' ({c.get('label','')}), frame {i+1}/{len(c['frames'])}, phase '{phase}'", 'hero', True, [384,384],
                  clip=clip, frame=i+1, frames=len(c['frames']), anchor=c.get('anchor',[0.5,1]), ms=fr.get('ms'),
                  note='ผืน 384×384 โปร่งใส ปลายเท้าที่ y≈378 กลางภาพ ห้าม crop/ขยายทีละเฟรม'))
for d in ('se','sw','ne','nw'):
    for i in range(1,7):
        add(entry(f'tactics-hero-{d}-walk-{i}', f'assets/tactics/hero_{d}_walk_{i:02d}.webp', 'tactics-hero', 'planned', f'grid-battle hero walking toward {d.upper()} (isometric 3/4), walk cycle frame {i}/6, empty hands', 'hero', True, [384,384], clip='tactics.walk.'+d, frame=i, frames=6, anchor=[0.5,0.9375],
                  note='โค้ดรองรับแล้ว: เพิ่ม walk:[...] 6 เฟรมใน tactics-sprites.js ทิศนั้น (ส่ง ZIP ให้ Claude ใส่จุดมือ)'))

# --- tactics sprites ---
ts = open('js/tactics-sprites.js', encoding='utf8').read()
T = json.loads(ts[ts.index('{'):ts.rindex('}')+1])
for d, poses in T['directions'].items():
    for pose, fr in poses.items():
        mirrored = d in ('SW','NW')
        add(entry(f'tactics-hero-{d.lower()}-{pose}', fr['src'], 'tactics-hero', 'temp' if mirrored else 'final',
                  f'grid-battle hero facing {d} (isometric 3/4 view), pose "{pose}", empty hands (weapons are attached by code)', 'hero', True, [384,384],
                  anchor=T['anchor'], hands={'right':fr['right'],'left':fr['left']},
                  note=('ตอนนี้เป็นภาพสะท้อนจาก '+('SE' if d=='SW' else 'NE')+' มือซ้าย/ขวาสลับ — วาดใหม่แล้วต้องปรับจุดมือในโหมด A') if mirrored else 'มือว่าง อาวุธประกอบด้วยโค้ดที่จุด right/left'))
for k, e in T['equipment'].items():
    st = 'temp' if k=='hammer' else 'final'
    add(entry('tactics-equip-'+k, e['src'], 'tactics-equipment', st, f'a single {k} drawn pointing straight up, grip at the pivot point', 'sprite', True, e.get('size'),
              pivot=e.get('pivot'), note='ด้ามค้อนวาดชั่วคราว (ภาพต้นฉบับเสีย)' if k=='hammer' else None))
for k, e in T['props'].items():
    add(entry('prop-'+k, e['src'], 'tactics-props', 'final', 'isometric '+k+' obstacle for a grass tile', 'sprite', True, e.get('size'), pivot=e.get('pivot')))
for k, n in [('knife','a short steel knife'),('spear','a long wooden spear with a steel leaf-shaped head'),('rapier','a slim rapier with a gold swept hilt')]:
    add(entry('tactics-equip-'+k, f'assets/tactics/{k}.webp', 'tactics-equipment', 'code', f'{n}, drawn alone pointing straight up, grip near the bottom third', 'sprite', True, [256,1024] if k=='spear' else [256,768] if k=='rapier' else [256,512],
              pivot=[0.5,0.75], usedIn='อาวุธทดสอบในสนามตาราง', note='ตอนนี้วาดด้วยโค้ด เมื่อใส่ภาพแล้วเกมใช้แทนทันที (ปรับจุดจับด้วย ✋)'))
add(entry('prop-pillar', 'assets/tactics/pillar.webp', 'tactics-props', 'final', 'isometric weathered stone pillar for a quarry tile', 'sprite', True, pivot=[0.62,0.95], usedIn='สนามเหมืองหินร้าง'))
for f in glob.glob('assets/tactics/ruins-*.webp'):
    add(entry('prop-'+os.path.splitext(os.path.basename(f))[0], f, 'tactics-props', 'final', 'stone ruins arch', 'sprite', True, usedIn='ยังไม่ได้ใช้ในสนาม'))

# --- code-drawn tactic cards (game swaps to the file as soon as status is final/temp) ---
TC = {'step':'a careful single step on a forest path, boot close-up','walk':'boots walking forward on a dirt road','run':'an adventurer running, motion lines, dust','sprint':'a dash with wind streaks and flying leaves',
      'attack':'a weapon swing hitting a straw training dummy','skill':'a powerful heavy blow with an orange shockwave','guard':'a raised wooden shield blocking sparks','rest':'deep breath, calm green leaves drifting','spell':'a violet magic arrow of light flying'}
for k, s in TC.items():
    add(entry('tactic-card-'+k, f'assets/cards/tactic-{k}.webp', 'tactic-cards', 'code', s, 'card', False, [1120,800], usedIn='ไพ่สนามตาราง (กรอบเล็ก 5:4)', note='ตอนนี้วาดด้วยโค้ด'))

# --- enemies / allies ---
add(entry('enemy-straw-soldier', 'assets/enemies/straw-soldier.webp', 'enemies', 'missing', 'a straw soldier: scarecrow body with a wooden spear and a dented pot helmet', 'enemy', True, [512,768],
          usedIn='ศัตรูออกสำรวจ (ทหารฟาง)', pivot=[0.5,1], note='ตอนนี้ใช้ภาพหุ่นไล่กาย่อขนาด'))
add(entry('enemy-straw-archer', 'assets/enemies/straw-archer.webp', 'enemies', 'missing', 'a straw archer: lean scarecrow with a short bow and a quiver, blue cloth scarf', 'enemy', True, [512,768],
          usedIn='ศัตรูออกสำรวจ (พลธนูฟาง ยิงไกล 4)', pivot=[0.5,1], note='ตอนนี้ใช้ภาพหุ่นไล่กาย้อมสีฟ้า'))
add(entry('enemy-straw-captain', 'assets/enemies/straw-captain.webp', 'enemies', 'missing', 'a large straw captain: bulky scarecrow in rusty armour plates with a red banner and a big wooden club', 'enemy', True, [512,768],
          usedIn='หัวหน้าเหมืองหินร้าง (เป้าหมายการรบ)', pivot=[0.5,1], note='ตอนนี้ใช้ภาพหุ่นไล่กาย้อมสีแดง'))
for k, n in [('luna','Luna, a young female mage with a wooden staff, violet hood'),('bram','Bram, a stocky young warrior with a war hammer and round shield, sturdy leather armour'),('kier','Kier, a lean young swordsman with a short cape'),('mil','Mil, a small cheerful junior swordsman with a big scarf')]:
    add(entry('ally-'+k, f'assets/allies/{k}.webp', 'allies', 'missing', f'companion {n}, same chibi art style as the hero reference, full body, isometric 3/4 view facing down-right (SE), weapon in hand', 'hero', True, [384,384],
              usedIn='เพื่อนร่วมทีม: ภาพการ์ด/หน้าตัวละคร (ถ้ายังไม่มีชุดภาพในสนาม เกมใช้ภาพนี้ในสนามแทน)', note='ใส่ไฟล์แล้วเกมใช้แทนภาพฮีโร่ทันที ทั้งในสนามและหน้าจ้าง'))

# --- v11–v13 game data (enemies, items, events, action cards, areas, card frames) read straight from the game code ---
import subprocess
try:
    G = json.loads(subprocess.check_output(['node', 'tools/dump-game-data.js']).decode('utf8'))
except Exception as ex:
    print('! node not available, skipping game-data entries:', ex); G = None
CARDSTYLE = 'card'
if G:
    RN = {'normal':'ทั่วไป','elite':'พิเศษ','miniboss':'รองหัวหน้า','boss':'หัวหน้า'}
    for k, e in G['enemies'].items():
        if not e.get('art'): continue
        area = G['areas'].get(e.get('area',''), {}).get('name', e.get('area') or 'ลานฝึก')
        if e.get('area'):
            add(entry(e['art'], f"assets/enemies/{e['art'][6:]}.webp", 'enemies', 'code', f"{e['name']} ({RN.get(e['rank'],'')}) monster of {area}", 'enemy', True, [512,768],
                  usedIn=f"ศัตรูผจญภัย · {e['name']} · {area} (ด้านหน้า)", pivot=[0.5,1], note='ด้านหน้า หันซ้ายล่าง (เกมกลับซ้าย-ขวาให้เอง) · ตอนนี้วาดด้วยโค้ด/ย้อมสีชั่วคราว'))
        add(entry(e['art']+'-back', f"assets/enemies/{e['art'][6:]}-back.webp", 'enemies', 'missing', f"{e['name']} ({RN.get(e['rank'],'')}) seen from behind — back view, facing up-left away from the viewer (3/4 back view), same design as the front image", 'enemy', True, [512,768],
                  usedIn=f"ศัตรู · {e['name']} (ด้านหลัง)", pivot=[0.5,1], note='ด้านหลัง หันซ้ายบน · ใช้ตอนศัตรูหันหลังให้กล้อง · ทำหลังจากได้ภาพด้านหน้าแล้ว แนบภาพด้านหน้าเป็นภาพอ้างอิง'))
    for grp, cat, pre, folder, label in [('consumables','items','item-','item','ของใช้'),('goods','items','item-','item','ไอเทมทั่วไป'),('events','items','event-','event','การ์ดเหตุการณ์')]:
        for k, x in G[grp].items():
            add(entry(pre+k, f'assets/cards/{folder}/{k}.webp', cat, 'code', f"{x['name']} — {x['text']}", 'card', False, [1120,800], usedIn=f"{label} · {x['name']}", note='ตอนนี้การ์ดแสดงลูกแก้วธาตุแทนภาพ'))
    for grp in ('move','combat'):
        for k, x in G[grp].items():
            if k in TC: continue
            add(entry('tactic-card-'+k, f'assets/cards/tactic-{k}.webp', 'tactic-cards', 'code', f"{x['name']} — tactics card action", 'card', False, [1120,800],
                      usedIn='การ์ด'+('เคลื่อนที่' if grp=='move' else 'แอ็กชัน')+'สนามตาราง'+(' (เฉพาะ '+x['owner']+')' if x.get('owner') else ''), note='ตอนนี้วาดด้วยโค้ด'))
    for k, a in G['areas'].items():
        add(entry('scene-area-'+k, f'assets/scenes/area-{k}.webp', 'scenes', 'missing', f"{a['name']} — adventure area backdrop", 'scene', False, [1920,1080], usedIn='พื้นหลังแผนที่ผจญภัย/สนามต่อสู้', note='ตอนนี้วาดด้วยโค้ด'))
# weapons: card/item art + the sprite held in battle (pointing straight up, grip at the pivot)
WPN = {'knife':'a short steel dagger','spear':'a long wooden spear with a steel leaf-shaped head','rapier':'a slim rapier with a swept gold hilt','staff':'a wooden mage staff with a glowing crystal','bow':'a recurve wooden hunting bow with a string','axe':'a one-handed steel battle axe with a wooden haft','tome':'a small holy tome with brass corners and a glowing light sigil'}
for k, sub in WPN.items():
    add(entry('weapon-'+k, f'assets/weapons/{k}.webp', 'items', 'temp', sub+' lying on a dark cloth on a workbench', 'item', False, [900,900], usedIn='สูตรคราฟต์ / การ์ดอุปกรณ์', note='ตอนนี้เป็นไอคอนชั่วคราว'))
    if k in ('bow','axe','tome'):
        add(entry('tactics-equip-'+k, f'assets/tactics/{k}.webp', 'tactics-equipment', 'missing', sub+', drawn alone pointing straight up, grip at the pivot', 'sprite', True, [256,768], usedIn='อาวุธในมือ สนามตาราง'))
for f in sorted(glob.glob('assets/cards/frame-*.webp')):
    n = os.path.splitext(os.path.basename(f))[0]
    add(entry(n, f, 'ui-packs', 'final', 'card frame '+n, 'ui', True, usedIn='กรอบการ์ด (โต๊ะการ์ด)'))

# v15 character standard (battle): SE + NE × idle/windup/strike/guard/hit/down — SW/NW are the same images flipped by the game
POSES = {'idle':'standing ready','windup':'winding up an attack','strike':'mid-strike, arm fully extended','guard':'guarding, braced','hit':'recoiling from a hit','down':'knocked down on the ground'}
ALLY_LOOK = {'luna':'Luna, a young female mage with a violet hood','bram':'Bram, a stocky young warrior with sturdy leather armour','kier':'Kier, a lean young swordsman with a short cape','mil':'Mil, a small cheerful junior swordsman with a big scarf'}
for key, look in ALLY_LOOK.items():
    for d, dn in (('se','facing down-right (SE)'),('ne','facing up-right (NE, back view)')):
        for pose, pd in POSES.items():
            add(entry(f'tactics-{key}-{d}-{pose}', f'assets/tactics/{key}_{d}_{pose}.webp', 'allies', 'missing', f'{look}, grid-battle sprite {dn}, pose "{pose}" ({pd}), empty hands (weapons are attached by the game), same size, framing and pose as the hero sheet tactics-hero-{d}-{pose}', 'hero', True, [384,384],
                      usedIn=f'เพื่อนร่วมทีม {key} ในสนาม', note='ใช้ภาพฮีโร่ท่าเดียวกันเป็นภาพอ้างอิงท่าทาง (ตำแหน่งมือต้องตรง อาวุธจะติดที่มือ) · SW/NW เกมกลับภาพให้เอง'))

# merge with an existing manifest (keep statuses/prompts edited by Asset Studio)
old = {}
if os.path.exists('data/asset-manifest.json'):
    try: old = {e['id']: e for e in json.load(open('data/asset-manifest.json', encoding='utf8'))['assets']}
    except Exception: pass
for e in items:
    o = old.get(e['id'])
    if o and (not e['id'].startswith(('ally-','enemy-')) or o.get('status') in ('final','temp')):
        for k in ('status','subject','note','history','artRevision'):
            if k in o: e[k] = o[k]
        if o.get('status') in ('final','temp') and 'prompt' in o: e['prompt'] = o['prompt']
# keep every entry that only exists in the old manifest (added by Asset Studio or by hand)
seen = {e['id'] for e in items}
items += [o for k, o in old.items() if k not in seen]
for e in items:   # v15 policy: battle-field pieces stay code-drawn · old apron village clips are no longer used
    if e['category'] == 'terrain' and e['status'] not in ('final','temp'): e['status'] = 'keep'
    if 'hero_daily_' in (e.get('file') or '') or e.get('file') == 'assets/hero.webp' : e['status'] = 'unused'
    if e['id'] in ('tactics-hero-se-idle','tactics-hero-sw-idle','tactics-hero-ne-idle','tactics-hero-nw-idle'): e['status'] = 'unused'   # v97.43: hero idle comes from studioPoses.idle (4 frames); the old single pictures were removed
manifest = {'version': 1, 'game': 'Adventure Card Game', 'categories': [{'id': c, 'name': n} for c, n in CATS],
            'statuses': {'final':'ภาพจริง','temp':'มีภาพแต่ชั่วคราว','code':'วาดด้วยโค้ดชั่วคราว','missing':'ยังไม่มีภาพ (เกมรองรับแล้ว ใส่ไฟล์ได้เลย)','planned':'ยังไม่มีภาพ และต้องเพิ่มโค้ด','keep':'วาดด้วยโค้ดถาวร (ไม่ต้องเจน)','unused':'ไม่ใช้แล้ว (ไม่ต้องเจน)'},
            'style': STYLE, 'greenScreen': GREEN.strip(), 'assets': items}
json.dump(manifest, open('data/asset-manifest.json','w',encoding='utf8'), ensure_ascii=False, indent=1)
open('js/asset-manifest.js','w',encoding='utf8').write('/* Generated by tools/build-asset-manifest.py and Asset Studio — the list of every game image. */\nwindow.ASSET_MANIFEST='+json.dumps(manifest, ensure_ascii=False)+';\n')
from collections import Counter
print(len(items), 'assets', Counter(e['status'] for e in items), Counter(e['category'] for e in items))
