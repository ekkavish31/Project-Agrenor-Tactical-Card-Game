# Maker logo intro

The approved `maker-logo-fixed-v2 1.html` is integrated as `assets/maker/aetheryn-logo.html`. Its SVG geometry, embedded images and animation tracks are preserved. Embedded mode hides the preview controls and fits the stage to the viewport without stretching.

`js/maker-logo.js` starts playback after the embedded artwork loads, fades the whole stage during 3.5–4.0 seconds and returns to the existing title menu. Escape, the skip button and the menu replay control are supported. Reduced-motion users go straight to the menu. The existing editor/skipTitle/new-game reload bypasses remain in effect.

The supplied `Intro - Adventure 01` track plays across the maker animation, story cutscene and title menu through the existing gesture-gated BGM manager and music-volume setting. The logo's letter-entry chimes, bird sparkle and finishing applause follow the artwork timestamps, use the existing effects-volume setting and only play after sound is enabled by a user gesture. The menu title is `Agrenor: Paths Unwritten`, rendered in a local fantasy-style serif font stack without external font downloads.

The supplied village track is used for all village and market-interior scenes; the music manager has no separate festival playlist, so normal and festival times use the same requested track. To keep loudness consistent while preserving the player's music-volume setting, decoded whole-track RMS was compared in dBFS: intro `-11.79` vs home `-20.95` and existing village `-19.83`; village track `-18.50` vs existing village `-19.83`. The intro playback gain is `0.52`, about `-5.7 dB`, bringing it to `-17.47 dBFS`—roughly 2.9 dB louder than the average existing home/village music, as requested. The village playback gain is `0.86`, about `-1.3 dB`, bringing it to `-19.81 dBFS`. These are unweighted whole-track RMS measurements, not LUFS; source MP3s remain unmodified.

Existing gameplay music stays on the established moderate default (`musicVolume: 0.3` versus SFX `volume: 0.65`). Intro chimes, sparkle and applause use short, bounded envelopes with the existing SFX volume control, keeping their transients clear without changing general gameplay audio levels.

The earlier 15-second game-opening prototype is no longer played automatically or by the menu replay button. Its source is retained for reference while the new Game Intro is pending. This change does not implement the planned twin companion system or alter the existing New Game story.
