/* v98.65 · per-character size adjustments written by scale-lineup.html (⚖ ปรับสเกล → บันทึกเข้าเกม). Do not hand-edit unless you know what you are doing.
   global[id]      = one factor for the character in EVERY scene (keeps proportions between characters consistent)
   scene[ctx][id]  = an extra factor for one scene only (ctx: battle · village · world)   → final size = global × scene
   ids: hero · bram · luna · kier · m:<monster key> · village NPC ids */
window.CHARACTER_SCALE_ADJUST = { "version": 1, "global": {}, "scene": { "battle": {}, "village": {}, "world": {} } };
