# Agrenor — New Game Prologue Kit v1
> Status: **kit integrated / 13 illustration slots awaiting artwork**. This is **New Game** after clicking the menu, NOT the maker logo/title-opening video.
> Current source of truth: `docs/lore/CURRENT-ERA-CANON.md` (approved section A), and game baseline/constraints.

## Playback wiring
- `index.html` loads `js/new-game-prologue-kit.js` before `js/title-screen.js`.
- `title-screen.js` reads `NewGamePrologueKit.pages` for the New Game storybook only. Legacy prose remains in source as fallback.
- Existing `SceneArt` draws temporary backgrounds with no missing files or white blank frames.
- After 13 pages, the existing hero-name form, the `BRIDGE` page, the `enter(true)` loading sequence, and Fernvale gameplay/first mother scene remain unchanged.
- Opening Intro (`js/game-intro.js`, `assets/intro/agrenor-intro.mp4`) and Title Menu are not modified.

## World storyboard / ready-to-fill image list
| ID | Story | Image filename | Image status | Existing temporary SceneArt |
|---|---|---|---|---|
| W01 | โลก Agrenor | `assets/new-game-prologue/images/world-panorama.webp` | TODO | `realmsWide` |
| W02 | ดินแดนเหนือ | `assets/new-game-prologue/images/northern-snowlands.webp` | TODO | `realms` |
| W03 | หมู่เกาะตะวันตก | `assets/new-game-prologue/images/western-archipelago.webp` | TODO | `realms` |
| W04 | ดินแดนใต้ | `assets/new-game-prologue/images/southern-firelands.webp` | TODO | `realms` |
| W05 | มหาพงไพรตะวันออก | `assets/new-game-prologue/images/eastern-great-forest.webp` | TODO | `deepwood` |
| W06 | ผู้คนหลายอารยธรรม | `assets/new-game-prologue/images/civilizations.webp` | TODO | `towns` |
| W07 | Nor’Chorthal | `assets/new-game-prologue/images/norchorthal-valley.webp` | TODO | `riverCity` |
| W08 | ความรุ่งเรืองของมนุษย์ | `assets/new-game-prologue/images/human-civilization.webp` | TODO | `towns` |
| W09 | ศาสตร์การ์ดเวท | `assets/new-game-prologue/images/card-crafting.webp` | TODO | `study` |
| W10 | การ์ดในชีวิตและการเดินทาง | `assets/new-game-prologue/images/traveler-card.webp` | TODO | `journey` |
| W11 | เรื่องเล่าของนักเดินทาง | `assets/new-game-prologue/images/travelers-stories.webp` | TODO | `roadOut` |
| W12 | ถนนสู่ Fernvale | `assets/new-game-prologue/images/road-to-fernvale.webp` | TODO | `roadOut` |
| W13 | Fernvale | `assets/new-game-prologue/images/fernvale-morning.webp` | TODO | `fernvale` |

## Production specification
- Each illustration: 1920×1080 landscape 16:9, warm painterly fantasy / anime-JRPG style, consistent light and restrained motion, no words, labels or watermark baked into the artwork.
- Maintain safe crop for dialogue at the bottom; characters/points of interest above middle; use gentle pan/crossfade not perpetual shake.
- Art images are NOT present yet; only filenames/slots exist. Do not create decorative dummy images that may later be mistaken for approved art.
- To activate one image: put reviewed `.webp` at its exact path, then add its ID (e.g. `'W07'`) to `APPROVED_IMAGES` in `js/new-game-prologue-kit.js`. It automatically replaces SceneArt for that page.
- If a named SceneArt fallback is missing in some future revision, use a supported art key from `SceneArt.scenes`.
- Recommended production sequence: W07 → W09 → W10 → W13 → W01–W06 → W08/W11/W12.

## Flow and lore constraints
1. World breadth (W01–W06): geography and cultural diversity; do not reveal the origin of ancient races.
2. Nor’Chorthal & humanity (W07–W08): human river civilization, economic and road networks. Do not imply all the world belongs to humans.
3. Magic cards (W09–W10): human craft as popularly understood. A card is a circuit; it formats the wielder's power, not an unlimited power source. Avoid revealing the ancient precursor to the art.
4. Travelers and Fernvale (W11–W13): stories travel with caravans; converge on the quiet village and on the existing first-day family/quest scenes.
5. Do NOT identify the mysterious stone from the later raid as an ancient magic card. A card-shaped stone is still a proposal, not approved canon.
6. Do not introduce new gods, city names, ancient peoples' names, Vaelari secrets, or assign a predetermined destiny to the player.

## Continuity / what this kit does NOT do
- The older prologue used myths about the ancestors and crystalline changes. The kit deliberately replaces **only its New Game narration** with current-era setting, not the world canon.
- **Mother/gift/possible paths**: in this repository the paintings `assets/intro/story/*.png` exist as assets of the **Opening Intro video**. The actual New Game handoff currently uses the hero name → BRIDGE → `js/story-data.js` opening scene. This kit **does not pretend** that the old gift/paths shots play again inside New Game. Their independent New Game treatment requires an explicit future decision to avoid duplicating the opening video.
- The tutorial chain `docs/STORY-INTRO.md` after entering Fernvale remains intact; do not rewrite save/quest logic under this artwork kit.

## Acceptance checks when images arrive
- New Game starts with W01 and advances W01…W13 in order, without missing-image flash or jitter.
- Escape/skip, name entry, transition to mother's cutscene and game remain functional.
- Continue does NOT show this prologue.
- The Opening Intro video/music and Title Menu are unchanged.
- Review Thai text readability with 16:9 and tablet; verify images on GitHub Pages hard refresh.
- Run a browser check when possible (not included in this kit-only commit).

## Files
- `js/new-game-prologue-kit.js`: authoritative narration and image slot registry.
- `data/new-game-prologue-assets.json`: structured production manifest.
- `assets/new-game-prologue/README.md`: asset-drop instructions.
