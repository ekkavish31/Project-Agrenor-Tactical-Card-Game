/* v98.23 · hand-painted interior sprites (docs/PROMPTS-INTERIOR-SHEETS.md · sheets 1–3). One entry per cut-out picture:
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
 }
};
