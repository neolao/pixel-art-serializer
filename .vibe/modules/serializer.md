# Module: serializer

**Role:** Combines an image's detected pixel grid and color palette into a single JSON-ready, versioned description: a format version number, grid size, palette as unified colors, and the palette index of every logical pixel.
**Files:** `src/serializer.ts`
**Exports:** `serializePixelArt(image: PixelImageData, grid: GridDetectionResult, palette: PaletteExtractionResult): PixelArtSerialization`, constant `FORMAT_VERSION`, types `PixelArtSerialization`, `SerializedPaletteColor`
**Depends on:** `modules/grid-detection.md`, `modules/palette-extraction.md`

Per-pixel palette indices are computed by re-sampling each grid cell and assigning it to the nearest palette color (Lab distance) among the opaque entries, rather than tracking merge provenance through palette extraction — see `.vibe/decisions/006-pixel-indices-by-nearest-palette-color.md`. A cell sampled as fully transparent is instead assigned directly to the reserved transparent index 0, never by Lab distance, so a fully-opaque color sharing its RGB (e.g. black) can't be mistaken for it — see `.vibe/decisions/011-palette-always-reserves-transparent-index-zero.md`.

The output carries `formatVersion` (currently `1`, bumped whenever the shape changes incompatibly), and each `SerializedPaletteColor` combines RGB and alpha into one 8-digit hex `color` string plus a `reserved` flag (true only for the permanent transparent entry) instead of separate `hex`/`alpha` fields — a deliberate, externally-consumed format documented in [docs/json-format.md](../../docs/json-format.md) and checked in tests against a published JSON Schema (`docs/pixel-art-serialization.schema.json`) so the two can never silently drift apart — see `.vibe/decisions/015-versioned-json-format-with-unified-color-and-reserved-flag.md` and `.vibe/decisions/016-json-schema-plus-ajv-conformance-test.md`.
