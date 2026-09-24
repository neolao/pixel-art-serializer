---
status: todo
---
# Detect Real Pixel Grid Size

## Description
Pixel art is drawn on a logical grid whose cells are often larger than one raw image pixel (upscaled art). The tool must detect the size of that logical pixel, in raw pixels, so the true grid dimensions (distinct from the image's width/height) can be computed.

## Acceptance Criteria
- [ ] System detects a logical pixel size greater than 1 for an upscaled pixel-art image with a uniform grid
- [ ] System detects a logical pixel size of 1 for a photo or image with no consistent grid
- [ ] System returns the resulting grid width and height in logical pixels, not raw image pixels

## Notes
Priority: MUST. Conceptually needs the loaded image from item 001, though no explicit ordering constraint was given.
