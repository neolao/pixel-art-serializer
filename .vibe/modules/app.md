# Module: app

**Role:** Bootstraps the page: renders the upload UI (title, description, file input, preview image, error message, result comparison, manual grid overlay/form, grid size, confidence verdict, palette, add-color controls, merge-toggle button, JSON download link) into `#app`, wires the file input's `change` event to the upload module, creates the reconstruction editor and the manual grid editor, and wires the preview image's `load` event to run detection, load its result into the editor, and render the confidence verdict and grid size.
**Files:** `src/main.ts`, `src/style.css`
**Exports:** none (entry point, run for its side effect of populating `#app`)
**Depends on:** `modules/upload.md`, `modules/result.md`, `modules/reconstruction-editor.md`, `modules/confidence.md`, `modules/manual-grid-editor.md`

Clears the previous result (`resetResult`) and resets both editors synchronously in the `change` handler, before the new file's validity is known, so a stale comparison, download, or in-flight edit never lingers next to a fresh upload or error. Tracks the currently selected file's name (for the downloadable JSON) and the current automatic `DetectionResult` (so a manual adjustment can be seeded from it, and "Return to automatic detection" can restore it without recomputing). A shared `showResult` step re-renders the reconstruction, confidence verdict, and grid size from any `DetectionResult` — used identically after the initial automatic detection, a confirmed manual adjustment, and a revert to automatic.
