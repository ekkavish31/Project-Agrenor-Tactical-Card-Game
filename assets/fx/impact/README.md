# Impact Core (v98.139)

`core-atlas.webp` is a lossless RGBA 2×2 atlas: light, heavy / critical, finisher. Each cell is 627×627 pixels; transparent margins are intentional. Keep the full cell when drawing. The original 32 skill/particle textures remain in place.

Generated with the built-in image-generation tool, then converted losslessly to WebP. These are four static painted stamps, animated by scale/fade plus existing particles in `js/battle-vfx.js`, not four hand-drawn frame sequences.

Production brief: four separate centered fantasy RPG impacts, warm cel-painted gold/amber; compact four-point light spark, heavy shard burst, red-gold critical cross, golden finisher core and broken halo. Transparent background, no text, weapons, characters, shadows or borders. Equal 2×2 cells with no overlap. Revision shrank all four shapes and their glows into their own cells with generous transparent padding.

Preview: `/vfx-preview.html` shows original and enhanced at 0.5× / 1× / 2× with low quality and reduced motion controls. Append `&impact=original` to a battle URL to use the old path. Enhanced is the default; until the atlas is decoded (or on a failed request), combat uses the old effects. The new texture is requested only once by BattleVFX.

Priority: finisher > critical > heavy > light. The current battle passes its existing `kill`, `crit`, `big` flags. The legacy renderer classifies positive non-periodic damage events; misses, full blocks and periodic damage do not receive a new stamp. Neither path modifies combat rules, damage, cards, saves or CT.

## Concurrent SVG integration preserved

The four SVG stamps from commits c77d1e6 / fed24c4 are retained as fallback when the painted atlas is unavailable. `impact=vector` explicitly selects them; `impact=0` remains an alias for the original pre-pack path. The existing `impactEnabled()` API remains available. Both renderers emit only one core stamp per hit. The legacy heavy threshold remains damage >= max(12, 25% max HP).
