# Module: grid-detection

**Role:** Detects the size of an image's logical pixel (the upscale factor of its grid, if any) and the resulting grid width/height, and extracts an image's raw pixel data from the DOM to feed that detection.
**Files:** `src/grid-detection.ts`, `src/pixel-data.ts`
**Exports:** `detectPixelGridSize(image: PixelImageData): GridDetectionResult`, `extractPixelData(image: HTMLImageElement): PixelImageData`, types `PixelImageData`, `GridDetectionResult`
**Depends on:** none

Not yet wired into `app`/`upload` — this ticket built the detection engine only; connecting it to the upload flow and displaying its result is later work.
