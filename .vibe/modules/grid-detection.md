# Module: grid-detection

**Role:** Detects the size of an image's logical pixel (the upscale factor of its grid, if any), the resulting grid width/height, and how regular that grid actually is; extracts an image's raw pixel data from the DOM to feed that detection.
**Files:** `src/grid-detection.ts`, `src/pixel-data.ts`
**Exports:** `detectPixelGridSize(image: PixelImageData): GridDetectionResult`, `extractPixelData(image: HTMLImageElement): PixelImageData`, types `PixelImageData`, `GridDetectionResult`
**Depends on:** none

Detection fits grid lines independently per axis by dynamic programming (each line snaps to the strongest local color-change edge, spacing free to drift within a tolerance), sweeps candidate cell sizes, and reads the true size off a sharp jump in within-cell color variance, refining by the spacing between edge-backed lines — see `.vibe/decisions/018-line-fitting-variance-knee-grid-detection.md` and `.vibe/decisions/019-independent-axis-refinement-plateau-guard.md`. This replaced an earlier pooled-run-length-mode approach that failed on images with soft/anti-aliased cell edges. `GridDetectionResult.gridRegularity` (0-1) is still the share of scanned horizontal/vertical same-color runs that match the detected cell size, forced to 0 whenever `pixelSize` is 1 (no consistent grid found at all) — consumed by `modules/confidence.md`. Known, accepted limitation: art with its own drawn grid lines (decoration, not the logical pixel grid) can defeat detection.
