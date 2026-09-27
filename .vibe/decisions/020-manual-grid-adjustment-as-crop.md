---
date: 2026-09-27
status: accepted
---
# Manual grid adjustment implemented as a crop, not a core model change

**Context:** The Product Owner asked for a way to manually correct the detected pixel grid (a draggable, resizable selection rectangle on the original image, plus a width/height-in-cells form) when automatic detection is wrong — notably to exclude a decorative border around the real content. The existing pipeline's `GridDetectionResult`/serialization always assumes the grid covers the *entire* source image (cell size is derived as `image.width / gridWidth`, with no offset); `sampleGridCellColor` and the serializer both rely on this.

**Decision:** Implement manual adjustment as a crop step: the user's selection rectangle defines a sub-region of the original image; on confirmation, the raw pixel data is cropped to that region, and the existing pipeline (palette extraction, serialization, reconstruction, confidence, download) runs unchanged on the cropped image with the form's manually given grid width/height, exactly as it already runs on the full image with an automatically detected grid.

**Reason:** Extending the core model with an explicit offset/sub-region would touch `GridDetectionResult`, `sampleGridCellColor`, the serializer's pixel loop, and the JSON format itself — a much larger, riskier change than the feature needs. Cropping first gets the identical user-facing outcome (a grid confined to the real content, border excluded) while reusing every existing, already-tested pipeline step untouched. The manual grid's width/height already matches what the form asks for; there is no need for the pipeline itself to know a manual override happened.

**Rejected alternatives:** adding `offsetX`/`offsetY` (and treating `gridWidth`/`gridHeight` against a sub-region instead of the whole image) to `GridDetectionResult` and threading it through palette extraction, serialization, and the JSON schema — rejected as disproportionate: it would require a new format version and change several already-stable, tested modules for a capability the crop approach delivers without touching any of them.
