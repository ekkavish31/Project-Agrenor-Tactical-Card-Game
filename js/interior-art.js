/* v98.23 · hand-painted interior sprites (docs/PROMPTS-INTERIOR-SHEETS.md · sheets 1–5A, 5B, 6, 7, 8, 9, 10, 11A and 11B (wall = [bottom-left x,y, bottom-right x,y, height] of a wall piece; ww = its width in wall tiles) (quad = a rug's top / right / left corners in the picture: the rug is stretched onto its floor rectangle)). One entry per cut-out picture:
   w,h = picture size · fx,fy = the centre of the object's floor footprint inside the picture · k = game px per picture px (the picture is drawn at this scale on the room grid, 1 tile = 68×34).
   interior.js draws a sprite for an item kind when its picture is loaded and falls back to the code-drawn shape otherwise. Facing: SE (the game mirrors it for SW). */
window.INTERIOR_ART={
 "table-round": {
  "src": "assets/interior/table-round.webp",
  "w": 285,
  "h": 299,
  "fx": 142,
  "fy": 251,
  "k": 0.245
 },
 "table-square": {
  "src": "assets/interior/table-square.webp",
  "w": 311,
  "h": 300,
  "fx": 156,
  "fy": 247,
  "k": 0.245
 },
 "table-long": {
  "src": "assets/interior/table-long.webp",
  "w": 393,
  "h": 330,
  "fx": 196,
  "fy": 271,
  "k": 0.245
 },
 "stool": {
  "src": "assets/interior/stool.webp",
  "w": 179,
  "h": 243,
  "fx": 90,
  "fy": 213,
  "k": 0.19
 },
 "chair": {
  "src": "assets/interior/chair.webp",
  "w": 221,
  "h": 346,
  "fx": 110,
  "fy": 308,
  "k": 0.2
 },
 "bench-long": {
  "src": "assets/interior/bench-long.webp",
  "w": 378,
  "h": 303,
  "fx": 189,
  "fy": 250,
  "k": 0.22
 },
 "stool-bar": {
  "src": "assets/interior/stool-bar.webp",
  "w": 197,
  "h": 347,
  "fx": 98,
  "fy": 314,
  "k": 0.15
 },
 "table-side": {
  "src": "assets/interior/table-side.webp",
  "w": 197,
  "h": 306,
  "fx": 98,
  "fy": 273,
  "k": 0.245
 },
 "table-barrel": {
  "src": "assets/interior/table-barrel.webp",
  "w": 254,
  "h": 337,
  "fx": 127,
  "fy": 301,
  "k": 0.157
 },
 "counter-bar": {
  "src": "assets/interior/counter-bar.webp",
  "w": 412,
  "h": 334,
  "fx": 206,
  "fy": 231,
  "k": 0.3301,
  "stretch": 3,
  "noShadow": true
 },
 "counter-bar-end": {
  "src": "assets/interior/counter-bar-end.webp",
  "w": 234,
  "h": 255,
  "fx": 117,
  "fy": 196,
  "k": 0.2906
 },
 "counter-shop": {
  "src": "assets/interior/counter-shop.webp",
  "w": 416,
  "h": 331,
  "fx": 208,
  "fy": 227,
  "k": 0.3269,
  "stretch": 3,
  "noShadow": true
 },
 "counter-guild": {
  "src": "assets/interior/counter-guild.webp",
  "w": 403,
  "h": 331,
  "fx": 202,
  "fy": 230,
  "k": 0.3375,
  "stretch": 3,
  "noShadow": true
 },
 "counter-healer": {
  "src": "assets/interior/counter-healer.webp",
  "w": 384,
  "h": 319,
  "fx": 192,
  "fy": 223,
  "k": 0.3542,
  "stretch": 3,
  "noShadow": true
 },
 "desk-writing": {
  "src": "assets/interior/desk-writing.webp",
  "w": 326,
  "h": 326,
  "fx": 163,
  "fy": 261,
  "k": 0.3129
 },
 "stage": {
  "src": "assets/interior/stage.webp",
  "w": 466,
  "h": 282,
  "fx": 233,
  "fy": 152,
  "k": 0.31,
  "noShadow": true
 },
 "stairs": {
  "src": "assets/interior/stairs.webp",
  "w": 293,
  "h": 355,
  "fx": 146,
  "fy": 282,
  "k": 0.3481,
  "mirror": true,
  "noShadow": true
 },
 "counter-flap": {
  "src": "assets/interior/counter-flap.webp",
  "w": 263,
  "h": 291,
  "fx": 132,
  "fy": 225,
  "k": 0.2586
 },
 "crate": {
  "src": "assets/interior/crate.webp",
  "w": 280,
  "h": 278,
  "fx": 140,
  "fy": 208,
  "k": 0.21
 },
 "crate-stack": {
  "src": "assets/interior/crate-stack.webp",
  "w": 274,
  "h": 346,
  "fx": 137,
  "fy": 278,
  "k": 0.22
 },
 "keg": {
  "src": "assets/interior/keg.webp",
  "w": 215,
  "h": 277,
  "fx": 107,
  "fy": 234,
  "k": 0.22
 },
 "basket": {
  "src": "assets/interior/basket.webp",
  "w": 262,
  "h": 210,
  "fx": 131,
  "fy": 158,
  "k": 0.19
 },
 "trunk": {
  "src": "assets/interior/trunk.webp",
  "w": 297,
  "h": 257,
  "fx": 148,
  "fy": 183,
  "k": 0.22
 },
 "shelf-store": {
  "src": "assets/interior/shelf-store.webp",
  "w": 280,
  "h": 396,
  "fx": 140,
  "fy": 326,
  "k": 0.23
 },
 "shelf-books": {
  "src": "assets/interior/shelf-books.webp",
  "w": 281,
  "h": 397,
  "fx": 140,
  "fy": 327,
  "k": 0.23
 },
 "rack-weapons": {
  "src": "assets/interior/rack-weapons.webp",
  "w": 308,
  "h": 393,
  "fx": 154,
  "fy": 341,
  "k": 0.205
 },
 "rack-tools": {
  "src": "assets/interior/rack-tools.webp",
  "w": 309,
  "h": 337,
  "fx": 154,
  "fy": 284,
  "k": 0.205
 },
 "furnace": {
  "src": "assets/interior/furnace.webp",
  "w": 426,
  "h": 474,
  "fx": 213,
  "fy": 389,
  "k": 0.3
 },
 "anvil": {
  "src": "assets/interior/anvil.webp",
  "w": 240,
  "h": 281,
  "fx": 120,
  "fy": 228,
  "k": 0.2
 },
 "quench": {
  "src": "assets/interior/quench.webp",
  "w": 315,
  "h": 278,
  "fx": 157,
  "fy": 199,
  "k": 0.205
 },
 "bellows": {
  "src": "assets/interior/bellows.webp",
  "w": 351,
  "h": 332,
  "fx": 175,
  "fy": 262,
  "k": 0.19
 },
 "grindstone": {
  "src": "assets/interior/grindstone.webp",
  "w": 288,
  "h": 307,
  "fx": 144,
  "fy": 244,
  "k": 0.21
 },
 "bench-smith": {
  "src": "assets/interior/bench-smith.webp",
  "w": 363,
  "h": 306,
  "fx": 181,
  "fy": 233,
  "k": 0.2
 },
 "coal-bin": {
  "src": "assets/interior/coal-bin.webp",
  "w": 318,
  "h": 331,
  "fx": 159,
  "fy": 252,
  "k": 0.205
 },
 "ingots": {
  "src": "assets/interior/ingots.webp",
  "w": 295,
  "h": 220,
  "fx": 147,
  "fy": 155,
  "k": 0.21
 },
 "forge-open": {
  "src": "assets/interior/forge-open.webp",
  "w": 317,
  "h": 377,
  "fx": 158,
  "fy": 298,
  "k": 0.2
 },
 "bed-single": {
  "src": "assets/interior/bed-single.webp",
  "w": 346,
  "h": 350,
  "fx": 173,
  "fy": 267,
  "k": 0.31
 },
 "bed-double": {
  "src": "assets/interior/bed-double.webp",
  "w": 409,
  "h": 383,
  "fx": 204,
  "fy": 285,
  "k": 0.34
 },
 "bed-cot": {
  "src": "assets/interior/bed-cot.webp",
  "w": 351,
  "h": 287,
  "fx": 175,
  "fy": 203,
  "k": 0.3
 },
 "footlocker": {
  "src": "assets/interior/footlocker.webp",
  "w": 317,
  "h": 274,
  "fx": 158,
  "fy": 195,
  "k": 0.21
 },
 "wardrobe": {
  "src": "assets/interior/wardrobe.webp",
  "w": 254,
  "h": 383,
  "fx": 127,
  "fy": 317,
  "k": 0.26
 },
 "rug-3x3": {
  "src": "assets/interior/rug-3x3.webp",
  "w": 440,
  "h": 340,
  "quad": [208, 3, 436, 166, 3, 139],
  "noShadow": true
 },
 "rug-4x3": {
  "src": "assets/interior/rug-4x3.webp",
  "w": 428,
  "h": 337,
  "quad": [167, 3, 424, 222, 3, 90],
  "noShadow": true
 },
 "rug-runner": {
  "src": "assets/interior/rug-runner.webp",
  "w": 396,
  "h": 324,
  "quad": [93, 3, 392, 259, 4, 48],
  "noShadow": true
 },
 "rug-round": {
  "src": "assets/interior/rug-round.webp",
  "w": 384,
  "h": 238,
  "quad": [192, -45, 458, 118, -75, 118],
  "noShadow": true
 },
 "altar": {
  "src": "assets/interior/altar.webp",
  "w": 416,
  "h": 344,
  "fx": 208,
  "fy": 244,
  "k": 0.34
 },
 "statue": {
  "src": "assets/interior/statue.webp",
  "w": 191,
  "h": 438,
  "fx": 95,
  "fy": 390,
  "k": 0.3
 },
 "pew": {
  "src": "assets/interior/pew.webp",
  "w": 398,
  "h": 353,
  "fx": 199,
  "fy": 257,
  "k": 0.33
 },
 "candelabra": {
  "src": "assets/interior/candelabra.webp",
  "w": 195,
  "h": 392,
  "fx": 97,
  "fy": 369,
  "k": 0.21
 },
 "candle-stand": {
  "src": "assets/interior/candle-stand.webp",
  "w": 223,
  "h": 322,
  "fx": 111,
  "fy": 277,
  "k": 0.2
 },
 "font": {
  "src": "assets/interior/font.webp",
  "w": 222,
  "h": 305,
  "fx": 111,
  "fy": 256,
  "k": 0.2
 },
 "lectern": {
  "src": "assets/interior/lectern.webp",
  "w": 230,
  "h": 366,
  "fx": 115,
  "fy": 315,
  "k": 0.21
 },
 "offering-box": {
  "src": "assets/interior/offering-box.webp",
  "w": 256,
  "h": 264,
  "fx": 128,
  "fy": 203,
  "k": 0.17
 },
 "brazier": {
  "src": "assets/interior/brazier.webp",
  "w": 198,
  "h": 305,
  "fx": 99,
  "fy": 265,
  "k": 0.18
 },
 "door-open": {
  "src": "assets/interior/door-open.webp",
  "hole": "assets/interior/door-open-hole.webp",
  "w": 262,
  "h": 389,
  "wall": [21, 383, 256, 333, 337.5],
  "ww": 1
 },
 "door-closed": {
  "src": "assets/interior/door-closed.webp",
  "w": 234,
  "h": 393,
  "wall": [22, 387, 228, 342, 348.0],
  "ww": 1
 },
 "door-double": {
  "src": "assets/interior/door-double.webp",
  "w": 367,
  "h": 403,
  "wall": [29, 399, 359, 335, 342.5],
  "ww": 2
 },
 "door-arch": {
  "src": "assets/interior/door-arch.webp",
  "w": 260,
  "h": 383,
  "wall": [31, 378, 256, 329, 309.0],
  "ww": 1
 },
 "window-casement": {
  "src": "assets/interior/window-casement.webp",
  "hole": "assets/interior/window-casement-hole.webp",
  "w": 258,
  "h": 336,
  "wall": [28, 329, 254, 256, 291.5],
  "ww": 1.2
 },
 "window-barred": {
  "src": "assets/interior/window-barred.webp",
  "hole": "assets/interior/window-barred-hole.webp",
  "w": 248,
  "h": 279,
  "wall": [28, 273, 243, 223, 237.0],
  "ww": 0.8
 },
 "window-arched": {
  "src": "assets/interior/window-arched.webp",
  "hole": "assets/interior/window-arched-hole.webp",
  "w": 205,
  "h": 395,
  "wall": [22, 389, 200, 346, 331.5],
  "ww": 1
 },
 "window-stained": {
  "src": "assets/interior/window-stained.webp",
  "w": 208,
  "h": 400,
  "wall": [24, 394, 204, 349, 337.5],
  "ww": 1
 },
 "window-shuttered": {
  "src": "assets/interior/window-shuttered.webp",
  "hole": "assets/interior/window-shuttered-hole.webp",
  "w": 370,
  "h": 355,
  "wall": [10, 309, 365, 234, 236.5],
  "ww": 2.2
 },
 "wall-shelf-jars": {
  "src": "assets/interior/wall-shelf-jars.webp",
  "w": 366,
  "h": 348,
  "wall": [20, 342, 336, 324, 269.5],
  "ww": 2
 },
 "wall-shelf-books": {
  "src": "assets/interior/wall-shelf-books.webp",
  "w": 361,
  "h": 353,
  "wall": [24, 346, 356, 256, 289.0],
  "ww": 2
 },
 "noticeboard": {
  "src": "assets/interior/noticeboard.webp",
  "w": 262,
  "h": 365,
  "wall": [15, 358, 257, 300, 310.0],
  "ww": 1
 },
 "banner-long": {
  "src": "assets/interior/banner-long.webp",
  "w": 212,
  "h": 390,
  "wall": [0, 389, 211, 389, 389],
  "ww": 0.7
 },
 "banner-guild": {
  "src": "assets/interior/banner-guild.webp",
  "w": 268,
  "h": 366,
  "wall": [0, 365, 267, 365, 365],
  "ww": 0.9
 },
 "swords-shield": {
  "src": "assets/interior/swords-shield.webp",
  "w": 332,
  "h": 353,
  "wall": [0, 352, 331, 352, 352],
  "ww": 1.2
 },
 "antlers": {
  "src": "assets/interior/antlers.webp",
  "w": 343,
  "h": 363,
  "wall": [0, 362, 342, 362, 362],
  "ww": 1
 },
 "wall-torch": {
  "src": "assets/interior/wall-torch.webp",
  "w": 174,
  "h": 357,
  "wall": [0, 356, 173, 356, 356],
  "ww": 0.4
 },
 "painting": {
  "src": "assets/interior/painting.webp",
  "w": 297,
  "h": 348,
  "wall": [17, 343, 292, 277, 283.5],
  "ww": 0.9
 },
 "mortar-table": {
  "src": "assets/interior/mortar-table.webp",
  "w": 364,
  "h": 367,
  "fx": 182,
  "fy": 276,
  "k": 0.2
 },
 "potion-table": {
  "src": "assets/interior/potion-table.webp",
  "w": 255,
  "h": 353,
  "fx": 127,
  "fy": 289,
  "k": 0.19
 },
 "herb-cabinet": {
  "src": "assets/interior/herb-cabinet.webp",
  "w": 333,
  "h": 421,
  "fx": 166,
  "fy": 338,
  "k": 0.21
 },
 "drawer-cabinet": {
  "src": "assets/interior/drawer-cabinet.webp",
  "w": 344,
  "h": 370,
  "fx": 172,
  "fy": 284,
  "k": 0.2
 },
 "doctor-chair": {
  "src": "assets/interior/doctor-chair.webp",
  "w": 244,
  "h": 369,
  "fx": 122,
  "fy": 315,
  "k": 0.22
 },
 "bandage-basket": {
  "src": "assets/interior/bandage-basket.webp",
  "w": 267,
  "h": 217,
  "fx": 133,
  "fy": 150,
  "k": 0.17
 },
 "folding-screen": {
  "src": "assets/interior/folding-screen.webp",
  "w": 317,
  "h": 379,
  "fx": 158,
  "fy": 316,
  "k": 0.3
 },
 "wash-stand": {
  "src": "assets/interior/wash-stand.webp",
  "w": 243,
  "h": 330,
  "fx": 121,
  "fy": 272,
  "k": 0.2
 },
 "herb-drying-rack": {
  "src": "assets/interior/herb-drying-rack.webp",
  "w": 316,
  "h": 372,
  "fx": 158,
  "fy": 302,
  "k": 0.2
 },
 "loom": {
  "src": "assets/interior/loom.webp",
  "w": 331,
  "h": 405,
  "fx": 165,
  "fy": 326,
  "k": 0.22
 },
 "bread-oven": {
  "src": "assets/interior/bread-oven.webp",
  "w": 336,
  "h": 388,
  "fx": 168,
  "fy": 307,
  "k": 0.2
 },
 "carpenter-bench": {
  "src": "assets/interior/carpenter-bench.webp",
  "w": 400,
  "h": 338,
  "fx": 200,
  "fy": 246,
  "k": 0.27
 },
 "log-pile": {
  "src": "assets/interior/log-pile.webp",
  "w": 405,
  "h": 355,
  "fx": 202,
  "fy": 262,
  "k": 0.26
 },
 "writing-desk": {
  "src": "assets/interior/writing-desk.webp",
  "w": 314,
  "h": 342,
  "fx": 157,
  "fy": 267,
  "k": 0.21
 },
 "net-rack": {
  "src": "assets/interior/net-rack.webp",
  "w": 344,
  "h": 373,
  "fx": 172,
  "fy": 297,
  "k": 0.2
 },
 "millstone": {
  "src": "assets/interior/millstone.webp",
  "w": 330,
  "h": 304,
  "fx": 165,
  "fy": 225,
  "k": 0.16
 },
 "spinning-wheel": {
  "src": "assets/interior/spinning-wheel.webp",
  "w": 269,
  "h": 349,
  "fx": 134,
  "fy": 290,
  "k": 0.22
 },
 "cook-hearth": {
  "src": "assets/interior/cook-hearth.webp",
  "w": 396,
  "h": 374,
  "fx": 198,
  "fy": 283,
  "k": 0.27,
  "longU": true
 },
 "stall-red": {
  "src": "assets/interior/stall-red.webp",
  "w": 383,
  "h": 407,
  "fx": 191,
  "fy": 319,
  "k": 0.27
 },
 "stall-blue": {
  "src": "assets/interior/stall-blue.webp",
  "w": 381,
  "h": 408,
  "fx": 190,
  "fy": 320,
  "k": 0.27
 },
 "stall-green": {
  "src": "assets/interior/stall-green.webp",
  "w": 383,
  "h": 415,
  "fx": 191,
  "fy": 327,
  "k": 0.27
 },
 "stall-gold": {
  "src": "assets/interior/stall-gold.webp",
  "w": 385,
  "h": 415,
  "fx": 192,
  "fy": 326,
  "k": 0.27
 },
 "fruit-crate": {
  "src": "assets/interior/fruit-crate.webp",
  "w": 338,
  "h": 291,
  "fx": 169,
  "fy": 210,
  "k": 0.19
 },
 "veg-basket": {
  "src": "assets/interior/veg-basket.webp",
  "w": 380,
  "h": 308,
  "fx": 190,
  "fy": 224,
  "k": 0.15
 },
 "sack-pile": {
  "src": "assets/interior/sack-pile.webp",
  "w": 352,
  "h": 320,
  "fx": 176,
  "fy": 243,
  "k": 0.17
 },
 "cheese-table": {
  "src": "assets/interior/cheese-table.webp",
  "w": 364,
  "h": 310,
  "fx": 182,
  "fy": 230,
  "k": 0.19
 },
 "price-post": {
  "src": "assets/interior/price-post.webp",
  "w": 193,
  "h": 357,
  "fx": 96,
  "fy": 322,
  "k": 0.22
 },
 "quest-board": {
  "src": "assets/interior/quest-board.webp",
  "w": 405,
  "h": 420,
  "fx": 202,
  "fy": 327,
  "k": 0.27
 },
 "trophy-case": {
  "src": "assets/interior/trophy-case.webp",
  "w": 246,
  "h": 408,
  "fx": 123,
  "fy": 349,
  "k": 0.23
 },
 "reg-desk": {
  "src": "assets/interior/reg-desk.webp",
  "w": 417,
  "h": 327,
  "fx": 208,
  "fy": 231,
  "k": 0.27
 },
 "armor-stand": {
  "src": "assets/interior/armor-stand.webp",
  "w": 210,
  "h": 417,
  "fx": 105,
  "fy": 371,
  "k": 0.21
 },
 "weapon-barrel": {
  "src": "assets/interior/weapon-barrel.webp",
  "w": 207,
  "h": 360,
  "fx": 103,
  "fy": 310,
  "k": 0.2
 },
 "map-table": {
  "src": "assets/interior/map-table.webp",
  "w": 402,
  "h": 324,
  "fx": 201,
  "fy": 228,
  "k": 0.25
 },
 "training-dummy": {
  "src": "assets/interior/training-dummy.webp",
  "w": 231,
  "h": 372,
  "fx": 115,
  "fy": 326,
  "k": 0.2
 },
 "banner-stand": {
  "src": "assets/interior/banner-stand.webp",
  "w": 153,
  "h": 405,
  "fx": 76,
  "fy": 374,
  "k": 0.24
 },
 "gear-bench": {
  "src": "assets/interior/gear-bench.webp",
  "w": 411,
  "h": 336,
  "fx": 205,
  "fy": 241,
  "k": 0.27
 },
 "fireplace-stone": {
  "src": "assets/interior/fireplace-stone.webp",
  "w": 317,
  "h": 420,
  "fx": 158,
  "fy": 341,
  "k": 0.31,
  "longV": true
 },
 "fireplace-grand": {
  "src": "assets/interior/fireplace-grand.webp",
  "w": 448,
  "h": 435,
  "fx": 224,
  "fy": 323,
  "k": 0.29,
  "longV": true
 },
 "fireplace-pot": {
  "src": "assets/interior/fireplace-pot.webp",
  "w": 317,
  "h": 416,
  "fx": 158,
  "fy": 337,
  "k": 0.31,
  "longV": true
 },
 "stove-iron": {
  "src": "assets/interior/stove-iron.webp",
  "w": 224,
  "h": 394,
  "fx": 112,
  "fy": 349,
  "k": 0.24
 },
 "fire-tools": {
  "src": "assets/interior/fire-tools.webp",
  "w": 152,
  "h": 343,
  "fx": 76,
  "fy": 320,
  "k": 0.2
 },
 "log-basket": {
  "src": "assets/interior/log-basket.webp",
  "w": 260,
  "h": 226,
  "fx": 130,
  "fy": 169,
  "k": 0.18
 },
 "floor-lamp": {
  "src": "assets/interior/floor-lamp.webp",
  "w": 144,
  "h": 382,
  "fx": 72,
  "fy": 353,
  "k": 0.22
 },
 "table-lantern": {
  "src": "assets/interior/table-lantern.webp",
  "w": 133,
  "h": 239,
  "fx": 66,
  "fy": 219,
  "k": 0.2
 },
 "fire-pit": {
  "src": "assets/interior/fire-pit.webp",
  "w": 341,
  "h": 325,
  "fx": 170,
  "fy": 250,
  "k": 0.19
 }
};
