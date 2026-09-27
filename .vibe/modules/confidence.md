# Module: confidence

**Role:** Scores how likely an image is to actually be pixel art, combining the detected grid's regularity with how small its color palette is.
**Files:** `src/confidence.ts`
**Exports:** `computeConfidence(grid: GridDetectionResult, palette: PaletteExtractionResult): ConfidenceResult`, type `ConfidenceResult`
**Depends on:** `modules/grid-detection.md`, `modules/palette-extraction.md`

Averages `grid.gridRegularity` with a palette-size score (1 at 16 colors or fewer, 0 at 256 or more, linear in between) into an overall 0-1 score, a plain-word verdict at the 50% mark, and an explanation naming whichever signal is weak when the two disagree — see `.vibe/decisions/009-grid-regularity-exposed-from-detection.md`.
