# v67 — supplied layout and clean street frontages

Applied all 19 coordinates and facings from the supplied village-layout-v49.json without rounding. The file specifies automatic roads (roads: null), so existing routing regenerates streets for these positions. A versioned editor save key loads this layout on first use; later edits persist normally. The previous v49 editor save remains available. Reset restores the supplied layout.

Paving repeats at 240 world pixels instead of 600, rotated 45 degrees before the ground projection. Plot ground now renders before streets, and courtyard mouths refill over the curb to join the entrance to the street. Assembled plot decorations whose sampled ground footprint intersects pavement are omitted, with 8 pixels of clearance; tall foliage can still visually overhang a street. Placement is cached until road geometry or building layout changes. This does not alter walking geometry or embedded artwork inside building sprites.

Validation: native Canvas execution of village-town.html and its actual modules; exact layout equality; all 19 places and six exits connected; rendering leaves navigation mask unchanged; editor apply and reset exercised. Native renders are in art-production/v67. These are code-rendered scene previews, not browser screenshots; browser interaction and frame rate remain unverified.

The v66 experimental district preview remains separate. These changes are wired into village-town.html, the actual game scene.
