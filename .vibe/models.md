# Data models

## PixelImageData
| Field | Type | Notes |
|---|---|---|
| width | number | raw image width in pixels |
| height | number | raw image height in pixels |
| data | ArrayLike\<number\> | RGBA, row-major, length must equal `width * height * 4` |
Defined in: `src/grid-detection.ts`

## GridDetectionResult
| Field | Type | Notes |
|---|---|---|
| pixelSize | number | detected logical pixel size in raw pixels; `1` means no consistent grid was found |
| gridWidth | number | image width in logical pixels |
| gridHeight | number | image height in logical pixels |
| gridRegularity | number | 0-1, share of scanned runs matching the detected cell size; `0` whenever `pixelSize` is `1` |
Defined in: `src/grid-detection.ts`

## PaletteColor
| Field | Type | Notes |
|---|---|---|
| index | number | stable identifier of this color, not necessarily its array position (a removal can leave a gap) |
| r | number | red channel, 0-255 |
| g | number | green channel, 0-255 |
| b | number | blue channel, 0-255 |
| a | number | alpha channel, 0-255 |
Index 0 is always `{r:0,g:0,b:0,a:0}`, the reserved fully-transparent color.
Defined in: `src/palette-extraction.ts`

## PaletteExtractionResult
| Field | Type | Notes |
|---|---|---|
| colors | PaletteColor[] | the indexed distinct colors found |
| colorCount | number | total number of distinct colors, i.e. `colors.length` |
Defined in: `src/palette-extraction.ts`

## SerializedPaletteColor
| Field | Type | Notes |
|---|---|---|
| index | number | stable identifier of this color, not necessarily its array position (a removal can leave a gap) |
| color | string | color as one 8-digit hex string `#rrggbbaa` (RGB + alpha unified) |
| reserved | boolean | `true` only for the permanent, always-transparent entry (index 0) |
Index 0 is always the reserved fully-transparent color (`color: "#00000000"`, `reserved: true`).
Defined in: `src/serializer.ts`. Exported/versioned shape documented in [`../docs/json-format.md`](../docs/json-format.md) and `../docs/pixel-art-serialization.schema.json`.

## PixelArtSerialization
| Field | Type | Notes |
|---|---|---|
| formatVersion | number | the exported shape's version, currently `1` |
| gridWidth | number | image width in logical pixels |
| gridHeight | number | image height in logical pixels |
| palette | SerializedPaletteColor[] | the indexed color palette |
| pixels | number[] | row-major, one palette index per logical pixel, length `gridWidth * gridHeight` |
Defined in: `src/serializer.ts`. This is the exact shape of the file downloaded by the app.

## CropRect
| Field | Type | Notes |
|---|---|---|
| x | number | left edge, in raw image pixels (rounded before use) |
| y | number | top edge, in raw image pixels (rounded before use) |
| width | number | must be ≥ 1 after rounding, and fit within the image bounds |
| height | number | must be ≥ 1 after rounding, and fit within the image bounds |
Defined in: `src/image-crop.ts`. `src/grid-selection.ts`'s `SelectionRect` is the same shape, used for the live, in-progress selection state rather than a validated crop instruction — the two are structurally interchangeable but named for their distinct roles.

## ConfidenceResult
| Field | Type | Notes |
|---|---|---|
| score | number | 0-1, average of grid regularity and palette-size score |
| verdict | string | "Looks like pixel art" or "Doesn't look like pixel art" |
| explanation | string | one clause naming which signal is weak when they disagree |
Defined in: `src/confidence.ts`
