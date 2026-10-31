/* v98.23 · hand-painted interior sprites (docs/PROMPTS-INTERIOR-SHEETS.md · sheet 1). One entry per cut-out picture:
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
 }
};
