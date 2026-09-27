# Module: grid-detection

**Role:** Detects the size of an image's logical pixel (the upscale factor of its grid, if any), the resulting grid width/height, and how regular that grid actually is; extracts an image's raw pixel data from the DOM to feed that detection.
**Files:** `src/grid-detection.ts`, `src/pixel-data.ts`
**Exports:** `detectPixelGridSize(image: PixelImageData): GridDetectionResult`, `extractPixelData(image: HTMLImageElement): PixelImageData`, types `PixelImageData`, `GridDetectionResult`
**Depends on:** none

`GridDetectionResult.gridRegularity` (0-1) is the share of scanned horizontal/vertical runs that match the detected cell size, forced to 0 whenever `pixelSize` is 1 (no consistent grid found at all) — consumed by `modules/confidence.md`.
