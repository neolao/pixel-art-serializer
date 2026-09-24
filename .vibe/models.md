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
Defined in: `src/grid-detection.ts`

## PaletteColor
| Field | Type | Notes |
|---|---|---|
| index | number | position of this color in the palette |
| r | number | red channel, 0-255 |
| g | number | green channel, 0-255 |
| b | number | blue channel, 0-255 |
| a | number | alpha channel, 0-255 |
Defined in: `src/palette-extraction.ts`

## PaletteExtractionResult
| Field | Type | Notes |
|---|---|---|
| colors | PaletteColor[] | the indexed distinct colors found |
| colorCount | number | total number of distinct colors, i.e. `colors.length` |
Defined in: `src/palette-extraction.ts`
