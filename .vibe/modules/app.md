# Module: app

**Role:** Bootstraps the page: renders the upload UI (title, description, file input, preview image, error message, result comparison, palette, JSON download link) into `#app`, wires the file input's `change` event to the upload module, and wires the preview image's `load` event to the result module.
**Files:** `src/main.ts`, `src/style.css`
**Exports:** none (entry point, run for its side effect of populating `#app`)
**Depends on:** `modules/upload.md`, `modules/result.md`

Clears the previous result (`resetResult`) synchronously in the `change` handler, before the new file's validity is known, so a stale comparison or download never lingers next to a fresh upload or error. Tracks the currently selected file's name so it can be passed to the result module for naming the downloadable JSON.
