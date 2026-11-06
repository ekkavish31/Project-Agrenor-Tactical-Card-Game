# Illustrated story opening prototype

Maker logo now continues into the story opening before the title menu. Story timeline: cottage exterior, mother and twins, gift handoff, zoom toward the card deck, seven painted possibilities (farming, trade, government, war, ruins, divine light, dragon), return to deck, closed/open doorway, light into the menu. Story runs approximately 41 seconds after the four-second maker logo. Skip/Escape returns to the title; replay starts the maker/story sequence. Reduced motion bypasses playback.

Artwork is raster painted illustration. Paired gallery/departure paintings are stored together and displayed via CSS background positioning without changing the original files. Camera, cards, tunnel and transitions animate through browser-native animation tracks. Mother shot remains a camera move on one painting; gift/departure use dissolves between painted poses. Characters are not yet independently rigged papercraft layers; continuous finger, limb and walking motion is not implemented. No new narration/audio added.

`dev/agrenor-full-intro.html` is a self-contained offline review copy with embedded paintings. It opens directly into the story and provides replay at the end; the game's full flow starts with the maker logo. The previous short preview remains available.

Village loading is deferred until the story exits, with a timeout fallback; hidden title-mode village rendering remains disabled. Save/progression and twin companion systems are unchanged.

Validation: JS syntax and diff whitespace; Chromium maker-to-story transition, seven gallery cards, representative timeline scenes, skip/automatic exit, deferred village release and absence of page script errors.

## Tunnel motion revision

The gallery now uses seven distinct 3D entry/hold/exit paths, a long readable hold, per-scene rim glow, twelve distant painted cards, eighteen light particles and separate moving light/fog layers. Seven echo cards converge toward the returning deck. Card-entry light and the final doorway flash retain the existing 41-second timeline. Native animation tracks drive transforms/opacity; JavaScript advances the progress indicator and changes the palette at scene boundaries. Optional synthesized stereo cues are muted initially and enabled through a user gesture. Recorded ambience/music is not included. Papercraft remains an isolated experiment and is not used by this opening.

## Single gift shot and doorway reveal

Removed the second gift pose from playback and preload; the original gift painting now holds and zooms toward its card deck. The return shot uses that same painting. Doorway light expands from the door, reaches opaque white, then hides the painted scenes while fading away to the real menu beneath it. Background tunnel cards now show decorative backs rather than recycled scene artwork. War smoke, divine glow, dragon eye light and breath use existing raster particle textures and are clipped inside their painting; they inherit the gallery transform. The smoke/breath is an atmospheric overlay, not a newly animated dragon fire-breath action. Offline preview embeds these textures too.

Chromium validation includes absence of the second gift node, 13 attached effect layers, full-opacity white during menu reveal and successful automatic menu handoff.
