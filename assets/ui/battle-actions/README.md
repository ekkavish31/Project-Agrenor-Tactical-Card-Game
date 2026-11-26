# Battle HUD art · v98.1080

Eight painted square control faces and two transparent card piles. Prompts: ivory parchment, aged gold, readable small painted objects; end/undo/auto/absorb/redraw/menu/grid/stop; navy compass-backed draw pile and loose ivory discard cards. No baked letters or counters. Built-in image generator, referenced the existing v2-deck menu material style. Cropped into independent WebP files.

Runtime: js/battle-hud-art.js and css/battle-hud-art.css; town-battle.js loads them. Labels, live counts and pressed/disabled state remain DOM-driven. Grid button is a child of fbActions; reserveHand positions controls above actual card bounds.
