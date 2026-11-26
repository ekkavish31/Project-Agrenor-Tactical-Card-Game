# Quest gift opening · 16 frames

`quest-gift-unroll.webp`: transparent painted 1774×887 atlas, 4 columns × 4 rows, row-major. 90 ms/frame (1.44 s), then hold frame 15 until the player acknowledges the quest/lesson. Dynamic quest lettering is drawn separately after the ribbon opens. Original red quest ribbon remains the failed-image fallback.

Generated with the built-in image tool using `quest-ribbon-red.webp` as style reference. Prompt: crimson silk gift box tied with antique gold ribbon, opening and transforming into two rolled scroll ends, then unfurling symmetrically into a blank crimson swallowtail banner; exactly 16 cells in a 4×4 landscape atlas, transparent background, fixed camera, no text, no scenery or rays. Cleanup edit requested clean alpha and consistent positioning. Converted losslessly to WebP; runtime uses measured per-frame centres to prevent registration jitter without resizing individual frames.

API: `QuestAnnouncement.show({title, details:[], lesson:{title,lines:[]}})` returns a Promise resolved only by the “เข้าใจแล้ว” button (Space/Enter activate it). Calls queue. Reduced motion immediately shows the final ribbon and details. Escape/backdrop do not dismiss. Image errors show the existing stretchable ribbon and retain acknowledgement.

Registration metadata and renderer: `js/quest-announcement.js`; presentation: `css/story.css`. All ordinary good/default notices keep their original toast lifecycle.
