# Mip completion · v98.1156
The supplied 8-frame run-to-sit transition and 12-frame front-seated idle are the only new runtime art. Existing mip-sheet.webp is untouched. No new generation is used.

Sources: mip-sit-source.webp (4×2), mip-rest-source.webp (4×3). Runtime: mip-sit-sheet.webp (8×1), mip-rest-sheet.webp (12×1), 256 px cells. import-mip-rest.py uses one anatomical scale per sequence, neck-gem datum for horizontal turn alignment and the same 245 px foot baseline as the current run. Datums are in mip-rest-datums.json; sitting is not fit individually per pose.

MipLoader.still(el,true) captures the live CSS translation before disabling travel, then walks toward the current rail centre. Promise resolves after the eight transition frames; callers keep the cover until then. Blink runs through supplied idle frames with a brief closed-eye pose; breathing is 0.8% around the grounded paw baseline. Reduced motion starts centred and uses the still seated pose. Image failure keeps a grounded original frame; removal/restart cancels pending completion.

Integration: title/prologue loading, opening gate, standard/image gate, village startup and reusable place cover. Resizing during arrival retargets the centre. Reset with still(el,false) before a new load. No save data changes.
