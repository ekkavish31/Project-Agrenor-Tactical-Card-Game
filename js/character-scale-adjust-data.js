/* v98.65 · per-character size adjustments written by scale-lineup.html (⚖ ปรับสเกล → บันทึกเข้าเกม). Do not hand-edit unless you know what you are doing.
   global[id] = one factor for the character in EVERY scene · scene[ctx][id] = an extra factor for one scene (battle · village · world) → final size = global × scene
   ids: hero · bram · luna · kier · m:<monster key> · village NPC ids */
window.CHARACTER_SCALE_ADJUST = {"version":1,"global":{"bram":1.25,"luna":1.03,"nadia":1.05,"mil":0.97,"olwen":0.95,"ren":1.1,"orla":1.05,"sigrid":1.2,"m:bandit":1.4,"m:wolf":1.5,"m:slime":1.3,"m:kobold":1.33,"m:golem":1.6,"m:bat":1.02,"m:gull":1.1,"m:frostWolf":1.35,"m:snowKobold":1.25,"m:yeti":1.5,"m:frostQueen":1.3,"m:shadowWolf":1.6,"m:dummy":1.15},"scene":{"battle":{},"village":{},"world":{}}};
