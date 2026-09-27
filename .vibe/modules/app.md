# Module: app

**Role:** Bootstraps the page: renders the upload UI (title, description, file input, preview image, error message, result comparison, confidence verdict, palette, add-color controls, merge-toggle button, JSON download link) into `#app`, wires the file input's `change` event to the upload module, creates the reconstruction editor, and wires the preview image's `load` event to run detection and load its result into the editor.
**Files:** `src/main.ts`, `src/style.css`
**Exports:** none (entry point, run for its side effect of populating `#app`)
**Depends on:** `modules/upload.md`, `modules/result.md`, `modules/reconstruction-editor.md`, `modules/confidence.md`

Clears the previous result (`resetResult`) and resets the reconstruction editor synchronously in the `change` handler, before the new file's validity is known, so a stale comparison, download, or in-flight edit never lingers next to a fresh upload or error. Tracks the currently selected file's name so it can be passed to the editor for naming the downloadable JSON.
