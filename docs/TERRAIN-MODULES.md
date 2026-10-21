# Authored terrain modules — first playable release

## Use

Open the game, enter training, then **ตั้งค่าฝึก → สนาม**:

- **ป่าผสม · สุ่มชิ้นส่วน**: seeded 35×35 map assembled from the catalog below. Works in 1v1 training or 5v10 test battle. **สุ่มสนามใหม่** changes the seed.
- **เนินหินลานขั้นบันได**: the original 25×25 textured hill, H0/H3/H6, with wide ramps and an alternate stair route.

Open `dev/terrain-modules.html` for a seed input, module names, four camera orientations, blocked-cell/edge overlay, and click-to-walk pathfinding review. This review uses markers for props and the actor; the main battle uses the existing game sprites. `dev/Agrenor_Textured_Hill_Demo.html` is the earlier self-contained hill demonstration.

## Catalog

Each category has four authored layouts; rotation is an additional variation, not counted as a separate layout.

| Category | Layouts |
| --- | --- |
| Hill | Terraced hill, long ridge, recessed hill, wide mesa |
| Forest | Sparse grove, central clearing, two groves, roadside woodland |
| Water | Pond, oxbow basin, island basin, twin pools |
| Meadow | Grassland, stone field, flower meadow, dirt clearing |
| Ruins | Broken gate, column court, broken wall, old shrine |

`js/tactics-map-modules.js` exports `catalog`, `create`, `connect`, and `validate`. The first release uses four non-overlapping 13×13 regions plus a 5×5 central ruin. A seeded shuffle chooses region placement, template and quarter-turn rotation. Reserved corridors connect regions. Vegetation is clustered around authored groups; water stays in connected basins with a two-cell causeway. This is a constrained layout generator, not an arbitrary biome or river-network generator. Multi-module rivers and biome-specific catalogs remain future extensions.

## Movement contract

- `surfaceCorners` is [NW, NE, SE, SW] in logical elevation units. It controls rendered geometry and interpolated walking height.
- `h` is the integer elevation used by existing tactical rules.
- `blocked` controls occupation; `void` suppresses rendering and picking.
- `exits` explicitly lists legal cardinal neighbors. Both edge endpoints must meet and the existing maximum height-step rule must pass.
- Both player and combat AI use `TacticsCore.reachable`; each footprint cell must cross a permitted edge. Multi-cell units cannot stand across a disconnected internal edge.
- Deep water uses `terrainLocked` so battle initialization cannot silently make it walkable.
- Generation verifies that every unblocked tile connects to the ally start. Invalid geometry fails explicitly instead of carving through the authored art.

The hill templates provide two entrances to the lower terrace and a broad route to the summit. Existing tactical height costs and combat calculations remain in force. Seed reproduction is stable within generator version 1.

## Rendering and integration

`js/tactics-hill-art.js` uses the generated grass/dirt/rock/moss atlas in `assets/terrain/hill-textures.jpg`, projects textures onto authored tops and exposed cliff faces, and caches rasterized tiles. Immutable decoded material images prevent a canvas source snapshot per draw. Projection changes invalidate the tile cache; movement/attack/hover overlays remain separate. Surface polygons are also used for picking; visible cliff faces cannot select hidden ground behind them.

The training selector exposes both maps. Story/expedition encounters are not reassigned automatically; an encounter can opt in with theme `modular-wilds`. Existing forest/quarry/mine/crag generation and v57 slope/cliff artwork are preserved.

## Validation

Run `node tests/terrain-modules.cjs` (no dependencies): 100 seeds, all 20 templates, determinism, non-overlapping footprints, complete walkability, reciprocal edges, continuous ramp seams, spawn placement, water restrictions, native battle creation across six themes and both modes, and a large-unit placement smoke check.

Optional render check: `node tests/render-terrain.cjs` requires `@napi-rs/canvas`. It loads the actual texture renderer, creates the preview PNG, checks all camera orientations, grid toggling and seed regeneration. The original hill demonstration was separately checked for ascent to H6 and descent to H0.

Canvas checks passed in the execution environment. A complete browser playthrough and on-device performance check have not been run; those remain necessary before treating this as a polished production map pack. This release adds playable module layouts and reused prop art, not twenty separately painted prop models.
