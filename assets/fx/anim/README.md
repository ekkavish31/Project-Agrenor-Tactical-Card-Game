# Painted battle spell sheets

`*-cast.webp`: eight square cells, four columns by two rows, read left to right.
Shared normalized feet anchor: `(0.5, 0.82)`. Do not trim or resize cells independently.
All images use lossless WebP with alpha. The PNG source art was generated with
the built-in image generation tool, then converted without changing pixels.

| Sheet | Prompt subject |
| --- | --- |
| ice-cast.webp | Cyan faceted ice eruption, impact peak, then shattering chips |
| lightning-cast.webp | Thin white-gold bolt with cobalt branches; no fog or halo |
| water-cast.webp | Turquoise curling splash, foam and droplets returning to ripples |
| wind-cast.webp | Mint wind ribbons and olive leaves forming and dispersing |
| earth-cast.webp | Ochre stone slabs erupting, crumbling, then settling |
| dark-cast.webp | Violet shadow pulse dissolving into curling wisps |
| heal-cast.webp | Emerald/gold healing ribbons, leaves and rising motes |
| shield-cast.webp | Translucent turquoise kite barrier with a gold leaf border |

Shared generation brief: hand-painted fantasy JRPG raster VFX, eight consecutive
phases from anticipation through impact to fading fragments, fixed center and
feet anchor, elevated 2:1 ground perspective, transparent negative space, no
characters, lettering, environment, borders or vector symbols.

Playback lives in `js/vfx-kit.js`, variant `painted8`. It is the default only
when the player/editor has no explicit selection and the global code-kit switch
is off. `?vfx=old`, `?vfx=new`, and existing per-effect choices retain priority.
Loading/missing images fall back through `BattleVFX` to the existing still art.
Reduced motion holds the peak frame and fades it without projectile travel.

The earlier fire sheets and their `atlas` variant remain separate.

## Runtime smoothing (v98.1112)

The source sheets keep their original 8 / 16 keyframes. `js/vfx-kit.js` renders
continuous in-betweens with premultiplied RGBA blending in a single reusable
384px-wide canvas (192px on low quality), preserving timing and anchors.
Element-specific deterministic particles use the same battle clock. Reduced
motion draws one still without particles. No new AI-painted source frames.
