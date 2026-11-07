# Game intro prototype

The title sequence currently plays the approved Aetheryn Studio maker logo, then an 8.5-second animatic, then fades into the existing Agrenor title menu:

1. **Scene II · A home that waits (4 seconds):** a warm interior, the mother with the twin siblings, and a short exchange about returning home.
2. **Scene III · Parting gifts (3 seconds):** a close-up of the mother's hands passing a family deck and the father's dagger to the siblings.
3. **Scene IV · Into the card (1.5 seconds):** the top card glows, opens into a light tunnel, and fades to the game menu.

The sequence is a visual timing prototype, not final character art. The family and hand-off are lightweight inline SVG/CSS illustrations because the repository does not yet contain finished artwork for the mother or these moments. It has a visible skip button and Escape shortcut, pauses its timer while the tab is hidden, respects reduced motion, and does not change saves, the New Game prologue, or the companion system. The menu replay control replays the maker logo and these three scenes together.

For the menu composition, the title now uses the open-sky `world-dawn.png` as its background, placing the existing menu in the upper-left sky. A small inline-vector pair in red and green travel capes replaces the lone, unidentified traveler as a temporary packing-up pose. This is a layout/character placeholder for evaluating composition, not a finished composite painting.

Implementation: `js/opening-cinematic.js` and `css/opening-cinematic.css`, loaded after the title screen by `index.html`. The maker logo implementation and its four-second animation are unchanged.
