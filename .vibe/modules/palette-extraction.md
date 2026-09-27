# Module: palette-extraction

**Role:** Extracts and indexes an image's color palette from its detected logical pixel grid, folding perceptually near-identical colors (compression-artifact noise) into a single palette entry, and always reserving the first entry for full transparency.
**Files:** `src/palette-extraction.ts`, `src/color.ts`
**Exports:** `extractColorPalette(image: PixelImageData, grid: GridDetectionResult): PaletteExtractionResult`, `sampleGridCellColor(image, grid, cx, cy): [r,g,b,a]`, types `PaletteColor`, `PaletteExtractionResult`; `rgbToLab(rgb): Lab`, `labDistance(a: Lab, b: Lab): number`, `rgbToHex(r, g, b): string`, `toHex8(hex, alpha): string`, `fromHex8(hex8): {hex, alpha}`, type `Lab`
**Depends on:** `modules/grid-detection.md`

`sampleGridCellColor` is exported so `modules/serializer.md` samples grid cells the exact same way the palette itself was built from. Index 0 is always a synthesized `{r:0,g:0,b:0,a:0}` entry, even for a fully-opaque image; every raw sample with `alpha === 0` collapses into it regardless of its RGB, before the perceptual merge runs on the remaining (opaque) samples — see `.vibe/decisions/011-palette-always-reserves-transparent-index-zero.md`. This lets `modules/reconstruction-editor.md` always offer a way to erase a pixel to transparent, even on images with no detected transparency.

When the perceptual merge combines two near-identical samples, their opacity is combined by taking the more opaque of the two rather than a count-weighted average, so a sample landing on an anti-aliased source edge never drags an otherwise fully-opaque color into rendering semi-transparent — see `.vibe/decisions/014-merged-alpha-takes-the-most-opaque-sample.md`.
