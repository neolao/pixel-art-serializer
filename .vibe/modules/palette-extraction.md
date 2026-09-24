# Module: palette-extraction

**Role:** Extracts and indexes an image's color palette from its detected logical pixel grid, folding perceptually near-identical colors (compression-artifact noise) into a single palette entry.
**Files:** `src/palette-extraction.ts`, `src/color.ts`
**Exports:** `extractColorPalette(image: PixelImageData, grid: GridDetectionResult): PaletteExtractionResult`, types `PaletteColor`, `PaletteExtractionResult`; `rgbToLab(rgb): Lab`, `labDistance(a: Lab, b: Lab): number`, type `Lab`
**Depends on:** `modules/grid-detection.md`

Not yet wired into `app`/`upload` — this ticket built the extraction engine only; connecting it to the upload flow and displaying its result is later work.
