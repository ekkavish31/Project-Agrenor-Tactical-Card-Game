# Opening cinematic prototype

Open `index.html` through the usual local HTTP server. The 15-second opening runs before the existing title menu. The existing New Game prologue, Continue, save data and development bypass (`?skipTitle` / editor / embedded pages) remain under `title-screen.js`.

Sequence: the two protagonists on a beginning card (0–3s), four possible paths (3–6.5s), the wider world (6.5–10s), the player's choice (10–12.5s), Agrenor title (12.5–15s), then the menu. Skip with the visible button or Escape; replay from the menu. Reduced-motion preference goes directly to the menu. Time does not advance while the tab is hidden.

New art:
- `assets/intro/heroes-dawn.png`: generated using the creator's latest attached main character references: female red embroidered cape and ponytail, male green embroidered cape and yellow scarf. Supersedes the old green-cape female reference.
- `assets/intro/world-dawn.png`: original painted world vista.
- Path cards reuse repository workshop, market, forest and ruins art.

This is animated illustrated artwork with card transforms, transitions, atmosphere and camera movement, not frame-by-frame character animation. Optional sound uses synthesized chimes, starts muted and requires a user gesture. No external music or API dependencies were added. The existing game's audio settings remain separate.

Implementation: `js/opening-cinematic.js` and `css/opening-cinematic.css`, loaded by `index.html`. New hero artwork is a CSS background to avoid the repository's legacy automatic PNG-to-WebP redirect. No environment publication or Git push was performed.
