# Asset Variety & Village Decoration Rule

## Requested change
- Add variety assets for Village and Battle Ground.
- Keep random decoration in empty outer village space.
- Disable automatic decoration only inside the grass/yard footprint owned by a location/building asset.
- Do not remove or alter the location asset's own authored pixels.
- Do not globally disable random trees, shrubs, flowers, or grass outside location footprints.

## Implementation safety note
The current source inspection confirmed the village rendering layer in `js/village-ui.js`, but did not identify the code that generates map-object footprints or scatters decorative objects. Do not apply a broad CSS hide or disable all scatter logic: that would also remove desired decoration from empty map space. Locate the village map/editor generator and add an exclusion mask/footprint check to its scatter pass before shipping the behavior change.

## Asset sheet status
Generated concept sheets are art-direction references, not game-ready sprite atlases. They contain multiple objects on a shared background and must be individually cut out, alpha-cleaned, checked for consistent perspective/scale/anchor, and added to the asset manifest before use in-game. Do not load these sheets as a single scene object.

## Acceptance checks
1. Empty village grass still receives random decoration.
2. The grass/yard footprint of each placed location receives no added scatter.
3. Moving/resizing a location moves its exclusion footprint with it.
4. Undo/reload/editor save do not reintroduce decoration inside the footprint.
5. Battle props are separately sliced and use explicit walkability/collision metadata.
