# Module: image-crop

**Role:** Extracts a sub-rectangle of raw pixel data as its own standalone image, so the rest of the detection pipeline can run on it exactly as it runs on a full image.
**Files:** `src/image-crop.ts`
**Exports:** `cropPixelData(image: PixelImageData, rect: CropRect): PixelImageData`, type `CropRect`
**Depends on:** none

Rounds fractional rectangle coordinates (a screen-to-image conversion during a drag is rarely a whole number) before validating; throws on a rectangle with no area or one that extends beyond the image bounds. No DOM dependency, tested with synthetic position-encoded pixel data (each pixel's channels store its own coordinates, so a crop's correctness is checked against the source directly). Used by `modules/result.md`'s `computeManualDetection` — see `.vibe/decisions/020-manual-grid-adjustment-as-crop.md`.
