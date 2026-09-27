# Module: result

**Role:** Displays the outcome of the detection pipeline: hides/clears any previous result, renders the reconstructed image and the color palette next to the original, and orchestrates the pipeline that produces them.
**Files:** `src/result.ts`
**Exports:** `resetResult(elements: ResultElements): void`, `renderPalette(container: HTMLElement, palette: readonly SerializedPaletteColor[]): void`, `renderReconstruction(canvas: HTMLCanvasElement, serialization: PixelArtSerialization): void`, `displayResult(image: HTMLImageElement, elements: ResultElements): void`, type `ResultElements`
**Depends on:** `modules/grid-detection.md`, `modules/palette-extraction.md`, `modules/serializer.md`

`resetResult` and `renderPalette` have no canvas/image-decode dependency and are covered by automated tests. `renderReconstruction` (draws to a live `<canvas>`, see `.vibe/decisions/007-reconstruction-rendered-to-live-canvas.md`) and `displayResult` (the pipeline orchestrator) depend on real canvas/image-decode behavior jsdom doesn't provide, so they're verified in a real browser instead — same precedent as `pixel-data.ts` (`.vibe/decisions/003-canvas-pixel-extraction-verified-at-runtime.md`).
