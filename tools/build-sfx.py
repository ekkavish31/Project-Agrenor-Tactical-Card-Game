#!/usr/bin/env python3
"""v98.297 · builds assets/audio/sfx/kenney/*.mp3 from Kenney's CC0 sound packs (mirrors on GitHub, cloned outside the repo):
   python3 tools/build-sfx.py [SRC_ROOT=/home/user]
   Sources (all CC0 1.0 — "may be used in personal and commercial projects, credit not required"):
     Calinou/kenney-ui-audio          (Kenney UI SFX Set)        → prefix ui/
     Calinou/kenney-interface-sounds  (Kenney Interface Sounds)  → prefix if/
     Boyquotes/kenney-rpg-audio-for-godot  (Kenney RPG Audio)    → prefix rpg/
     Boyquotes/kenney-impact-sounds-for-godot (Kenney Impact Sounds) → prefix imp/
     Boyquotes/kenney-sci-fi-sounds-for-godot (Kenney Sci-fi Sounds) → sf/ · kenney-digital-audio-for-godot → dg/ · kenney-music-jingles-for-godot → jg/
   Each file is converted to a small mono mp3 (the game already ships mp3 — Safari plays no Ogg). The list below is the CURATED set the game uses (js/sfx.js catalog). """
import subprocess, sys, os, glob
ROOT = sys.argv[1] if len(sys.argv) > 1 else '/home/user'
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'audio', 'sfx', 'kenney')
PACK = {'ui': 'calinou/kenney-ui-audio', 'if': 'calinou/kenney-interface-sounds', 'rpg': 'boyquotes/kenney-rpg-audio-for-godot', 'imp': 'boyquotes/kenney-impact-sounds-for-godot', 'sf': 'boyquotes/kenney-sci-fi-sounds-for-godot', 'dg': 'boyquotes/kenney-digital-audio-for-godot', 'jg': 'boyquotes/kenney-music-jingles-for-godot'}
def find(pack, name):
    for ext in ('ogg', 'wav'):
        hits = glob.glob(os.path.join(ROOT, PACK[pack], '**', name + '.' + ext), recursive=True)
        if hits: return hits[0]
    return None
# output name → (pack, source name)
SET = {}
def add(out, pack, *names):
    for i, n in enumerate(names): SET[out + ('-%d' % (i + 1) if len(names) > 1 else '')] = (pack, n)
# ── UI / HUD ──
add('ui-click', 'if', 'click_001', 'click_003', 'click_005')
add('ui-tick', 'if', 'tick_001', 'tick_002')
add('ui-back', 'if', 'back_001', 'back_003')
add('ui-close', 'if', 'close_001', 'close_003')
add('ui-open', 'if', 'open_001', 'open_003')
add('ui-toggle', 'if', 'toggle_001', 'toggle_003')
add('ui-select', 'if', 'select_001', 'select_004', 'select_007')
add('ui-confirm', 'if', 'confirmation_001', 'confirmation_002', 'confirmation_004')
add('ui-error', 'if', 'error_001', 'error_004')
add('ui-scroll', 'if', 'scroll_001', 'scroll_003')
add('ui-drop', 'if', 'drop_001', 'drop_003')
add('ui-pluck', 'if', 'pluck_001', 'pluck_002')
add('ui-question', 'if', 'question_001')
add('ui-bong', 'if', 'bong_001')
add('ui-maximize', 'if', 'maximize_001', 'maximize_004')
add('ui-minimize', 'if', 'minimize_001', 'minimize_004')
add('ui-hover', 'ui', 'rollover1', 'rollover3')
add('ui-mouseclick', 'ui', 'mouseclick1')
add('ui-switch', 'ui', 'switch3', 'switch10')
# ── world / items ──
add('coins', 'rpg', 'handle_coins', 'handle_coins_2')
add('door-open', 'rpg', 'door_open_1', 'door_open_2')
add('door-close', 'rpg', 'door_close_1', 'door_close_2')
add('book-open', 'rpg', 'book_open')
add('book-close', 'rpg', 'book_close')
add('book-flip', 'rpg', 'book_flip_1', 'book_flip_2')
add('cloth', 'rpg', 'cloth_1', 'cloth_3')
add('latch', 'rpg', 'metal_latch', 'metal_click')
add('creak', 'rpg', 'creak_1', 'creak_2')
add('pot', 'rpg', 'metal_pot_1', 'metal_pot_2')
add('leather', 'rpg', 'drop_leather', 'handle_small_leather')
add('chop', 'rpg', 'chop')
add('knife', 'rpg', 'knife_slice', 'knife_slice_2')
add('draw-knife', 'rpg', 'draw_knife_1', 'draw_knife_2')
add('belt', 'rpg', 'belt_handle_1', 'cloth_belt')
# ── footsteps ──
for surf, key in (('grass', 'grass'), ('wood', 'wood'), ('stone', 'concrete'), ('snow', 'snow'), ('carpet', 'carpet')):
    add('step-' + surf, 'imp', *['footstep_%s_00%d' % (key, k) for k in (0, 1, 2, 3)])
# ── impacts (battle) ──
add('hit-metal-light', 'imp', 'impact_metal_light_000', 'impact_metal_light_001', 'impact_metal_light_002')
add('hit-metal', 'imp', 'impact_metal_medium_000', 'impact_metal_medium_001')
add('hit-metal-heavy', 'imp', 'impact_metal_heavy_000', 'impact_metal_heavy_001')
add('hit-punch', 'imp', 'impact_punch_medium_000', 'impact_punch_medium_001', 'impact_punch_medium_002')
add('hit-punch-heavy', 'imp', 'impact_punch_heavy_000', 'impact_punch_heavy_001')
add('hit-wood', 'imp', 'impact_wood_medium_000', 'impact_wood_medium_001')
add('hit-wood-heavy', 'imp', 'impact_wood_heavy_000', 'impact_wood_heavy_001')
add('hit-plate', 'imp', 'impact_plate_light_000', 'impact_plate_medium_000')
add('hit-plate-heavy', 'imp', 'impact_plate_heavy_000')
add('hit-soft', 'imp', 'impact_soft_medium_000', 'impact_soft_heavy_000')
add('hit-generic', 'imp', 'impact_generic_light_000', 'impact_generic_light_001')
add('hit-glass', 'imp', 'impact_glass_light_000', 'impact_glass_medium_000')
add('hit-bell', 'imp', 'impact_bell_heavy_000')
add('hit-mining', 'imp', 'impact_mining_000', 'impact_mining_002')
add('hit-tin', 'imp', 'impact_tin_medium_000')
# ── magic, elements, buffs (digital + sci-fi packs: no recorded spell sounds exist in the free Kenney sets, these are the closest) ──
add('mg-cast', 'dg', 'phaser_up_1', 'phaser_up_3', 'phase_jump_2')
add('mg-magic', 'sf', 'force_field_001', 'force_field_003', 'force_field_000')
add('mg-heal', 'dg', 'power_up_5', 'power_up_8', 'power_up_2')
add('mg-lightning', 'dg', 'zap_1', 'zap_2', 'zap_two_tone')
add('mg-fire', 'sf', 'thruster_fire_000', 'thruster_fire_002', 'thruster_fire_004')
add('mg-earth', 'sf', 'explosion_crunch_000', 'explosion_crunch_002', 'low_frequency_explosion_000')
add('mg-boom', 'sf', 'low_frequency_explosion_001', 'explosion_crunch_004')
add('mg-slime', 'sf', 'slime_000', 'slime_001')
add('mg-shield', 'sf', 'force_field_002', 'force_field_004')
add('mg-debuff', 'dg', 'phaser_down_1', 'phaser_down_3', 'zap_three_tone_down')
add('mg-buff', 'dg', 'phaser_up_4', 'phaser_up_6', 'power_up_4')
# ── events / jingles ──
add('level-up', 'dg', 'power_up_10', 'power_up_12')
add('item-get', 'dg', 'pep_sound_3', 'pep_sound_5')
add('notify', 'dg', 'pep_sound_1', 'two_tone_1')
add('defeat', 'dg', 'low_three_tone', 'high_down')
add('victory', 'jg', 'jingles_pizzi_0', 'jingles_pizzi_3', 'jingles_pizzi_5')
add('quest-done', 'jg', 'jingles_pizzi_8', 'jingles_steel_1')
add('fanfare', 'jg', 'jingles_nes_0', 'jingles_hit_3')
os.makedirs(OUT, exist_ok=True)
missing = []; total = 0
for out, (pack, name) in sorted(SET.items()):
    src = find(pack, name)
    if not src: missing.append((out, pack, name)); continue
    dst = os.path.join(OUT, out + '.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', '32000', '-b:a', '56k', '-af', 'silenceremove=start_periods=1:start_threshold=-55dB,loudnorm=I=-20:TP=-2:LRA=7', dst], check=True)
    total += os.path.getsize(dst)
print('wrote %d files, %d KB' % (len(SET) - len(missing), total // 1024))
for m in missing: print('MISSING', m)
