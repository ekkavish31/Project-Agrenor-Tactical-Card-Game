/* v98.264 · ONE place for the numbers that turn "size in the ⚖ Scale Lineup" into pixels. Every scene and the lineup page read these; nothing else may hard-code them.
   size on screen = lineup metres (picture height measured by eye in ⚖, × the character's ⚖ factor)  →  × the scene's hero pixels ÷ 1.70  →  × the scene's size multiplier (js/map-scale.js).
   HERO_M            the hero is 1.70 m in the lineup (the yardstick)
   DRAW.hero / .ally how big the 384-px canvas of a hero / team-mate picture is drawn in a battle, in grid units (UNIT); the ratio ally/hero is the base height difference
   MON.base × .k     battle size of a monster = base × its table scale × k, per picture height (town-battle.js MON table)
   VILLAGE_HERO_PX   canvas px of the hero on the village map at multiplier 1 (sub-maps and interiors follow it)
   WORLD_HERO_PX     canvas px of the party token on the world map at multiplier 1
   INTERIOR_*        the same two numbers for the inside of a building */
(function (root) {
  'use strict';
  root.CharSize = Object.freeze({
    HERO_M: 1.70,
    DRAW: Object.freeze({ hero: 1.6, ally: 1.45 }),
    MON: Object.freeze({ base: 1.6, k: .8 }),
    VILLAGE_HERO_PX: 93.6,
    WORLD_HERO_PX: 76,
    INTERIOR_HERO_PX: 104,          /* hero canvas px inside a room (place-interior.html) at multiplier 1 */
    INTERIOR_NPC_SCALE: 104 / 93.6, /* VillagerDraw scale of a person inside a room at multiplier 1 = INTERIOR_HERO_PX / VILLAGE_HERO_PX (v98.379: was .95 → people in rooms were ~15 % smaller than the lineup says next to the hero) */
    FEET_Y: 360,                    /* every character picture is 384×384 with its feet (lowest opaque row) at y=360 — Asset Studio > Animation keeps it so */
    NPC_CANVAS_K: 384 * 84 / 330   /* canvas px of a VillagerDraw picture at scale 1 */
  });
})(globalThis);
