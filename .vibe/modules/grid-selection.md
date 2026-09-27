# Module: grid-selection

**Role:** Pure geometry for the manual grid adjustment's selection rectangle: resizing from a handle, moving, and mapping a client point to image-space coordinates.
**Files:** `src/grid-selection.ts`
**Exports:** `resizeFromHandle(rect: SelectionRect, handle: Handle, deltaX: number, deltaY: number, imageWidth: number, imageHeight: number): SelectionRect`, `moveRect(rect: SelectionRect, deltaX: number, deltaY: number, imageWidth: number, imageHeight: number): SelectionRect`, `toImageSpace(displayRect, imageWidth: number, imageHeight: number, clientX: number, clientY: number): { x: number; y: number }`, types `SelectionRect`, `Handle`
**Depends on:** none

`resizeFromHandle` keeps the edge opposite the dragged handle fixed and clamps both against a minimum size and the image bounds, so a drag can never invert the rectangle or push it outside the image. `moveRect` translates the whole rectangle, clamped to stay fully within the image. `toImageSpace` is the same coordinate-mapping technique as `modules/reconstruction-editor.md`'s `pixelIndexAt`, generalized from a discrete grid index to continuous coordinates, and returns the origin instead of dividing by zero for a degenerate (zero-size) display rect. No DOM dependency; used by `modules/manual-grid-editor.md`.
