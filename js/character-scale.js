/* v97.67 · character scale standard (used by Asset Studio → ⚖ ตรวจสเกล / frame editor ⚖ ปรับสเกลตามมาตรฐาน).
   measure = head width in px on the 384×384 canvas: the width of the silhouette (alpha > 40) across the top 20% of its bounding box.
   The head is used, not the height, because it does not change with the pose (crouch, lying, short stride).
   characters[id][context][direction]: context 'battle' = assets/tactics pictures (hero: TACTICS_SPRITES) · 'village' = assets/village-town/npc/<id>/ pictures.
   Directions follow the 4 diagonal views; SE/NE of the mirrored ones carry the same value as SW/NW.
   drawSize = how big a 384 canvas is drawn in battle (UNIT multiples, js/town-battle.js) → used to compare characters with each other on screen.
   Edit the numbers here to change a character's size; the Studio's 📌 (ตั้งเป็นมาตรฐาน) keeps a per-browser override in localStorage "project-a-char-scale-v1". */
window.CHARACTER_SCALE = {
  "version": 1,
  "tolerance": 0.06,
  "drawSize": { "hero": 1.6, "ally": 1.45 },
  "characters": {
    "hero": { "battle": { "SW": 112, "NW": 112, "NE": 112, "SE": 112 } },
    "bram": {
      "battle": { "SW": 74, "NW": 74, "NE": 74, "SE": 74 },
      "village": { "SW": 74, "NW": 68, "NE": 68, "SE": 75 }
    },
    "kier": { "village": { "SW": 61, "NW": 59, "NE": 58, "SE": 62 } },
    "luna": {
      "battle": { "SW": 96, "NW": 84, "NE": 84, "SE": 96 },
      "village": { "SW": 96, "NW": 92, "NE": 85, "SE": 92 }
    }
  }
};
