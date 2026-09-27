# Module: serializer

**Role:** Combines an image's detected pixel grid and color palette into a single JSON-ready description: grid size, palette as hex codes, and the palette index of every logical pixel.
**Files:** `src/serializer.ts`
**Exports:** `serializePixelArt(image: PixelImageData, grid: GridDetectionResult, palette: PaletteExtractionResult): PixelArtSerialization`, types `PixelArtSerialization`, `SerializedPaletteColor`
**Depends on:** `modules/grid-detection.md`, `modules/palette-extraction.md`

Per-pixel palette indices are computed by re-sampling each grid cell and assigning it to the nearest palette color (Lab distance) among the opaque entries, rather than tracking merge provenance through palette extraction — see `.vibe/decisions/006-pixel-indices-by-nearest-palette-color.md`. A cell sampled as fully transparent is instead assigned directly to the reserved transparent index 0, never by Lab distance, so a fully-opaque color sharing its RGB (e.g. black) can't be mistaken for it — see `.vibe/decisions/011-palette-always-reserves-transparent-index-zero.md`.
