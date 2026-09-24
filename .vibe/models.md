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
