# Module: serializer

**Role:** Combines an image's detected pixel grid and color palette into a single JSON-ready description: grid size, palette as hex codes, and the palette index of every logical pixel.
**Files:** `src/serializer.ts`
**Exports:** `serializePixelArt(image: PixelImageData, grid: GridDetectionResult, palette: PaletteExtractionResult): PixelArtSerialization`, types `PixelArtSerialization`, `SerializedPaletteColor`
**Depends on:** `modules/grid-detection.md`, `modules/palette-extraction.md`

Per-pixel palette indices are computed by re-sampling each grid cell and assigning it to the nearest palette color (Lab distance), rather than tracking merge provenance through palette extraction — see `.vibe/decisions/006-pixel-indices-by-nearest-palette-color.md`. Not yet wired into `app`/`upload` — this ticket built the serialization step only; connecting it to the upload flow and letting the user download it is later work.
