---
status: todo
---
# Normalize Sampled Cell Opacity

## Description

A palette color sampled at a grid cell keeps the raw alpha value found at that pixel. On anti-aliased edges of the source image (e.g. a black outline), that alpha can be partial (observed ~142/255 instead of 255), so the color is correctly detected (e.g. pure black) but renders semi-transparent — showing as gray against the reconstruction's background instead of solid black. Pixel art is expected to use flat, fully opaque colors, so this partial alpha should be normalized rather than passed through as-is.

## Acceptance Criteria

- [ ] User uploads an image whose grid-aligned edges land on anti-aliased source pixels (e.g. the Mario mushroom icon); the reconstruction renders the outline as solid black, not gray.
- [ ] The downloaded JSON's palette reports full opacity (alpha 255) for colors sampled from such edges, when the surrounding art is otherwise fully opaque.
- [ ] An image that legitimately uses partial transparency (a real semi-transparent pixel-art color) is not silently forced to full opacity — the fix targets anti-aliasing noise at cell sampling, not intentional alpha.

## Notes

Found while fixing the near-black color merge bug (commit e9af9a8, `src/color.ts`) — the palette now correctly reports a single `#000000` entry for the mushroom's outline, but that entry's alpha (~142) still makes it render as gray in the reconstruction canvas. Root cause and exact fix location (likely `sampleGridCellColor` in `src/palette-extraction.ts`, or a downstream rendering step) are not yet investigated — this needs a `/vibe:fix` pass to reproduce and diagnose properly.
