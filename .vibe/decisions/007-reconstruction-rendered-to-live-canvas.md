---
date: 2026-09-27
status: accepted
---
# Reconstruction rendered directly to a live canvas element, not through an image round-trip

**Context:** Implementing the result comparison screen (backlog item 005), the reconstructed image must be built purely from the serialized grid and palette JSON and displayed next to the original.

**Decision:** Draw the reconstruction directly onto a `<canvas>` element sized to exactly `gridWidth × gridHeight` pixels, and display that canvas in the page (scaled up via CSS with crisp/pixelated rendering), rather than exporting the canvas to a data URL and displaying it through an `<img>`.

**Reason:** Exporting through `canvas.toDataURL()` and back into an `<img>` re-encodes the pixel data (PNG encoding, potential color-management or alpha-premultiplication rounding in some engines), which risks the displayed reconstruction not exactly matching the palette's hex/alpha values — undermining the acceptance criterion that the reconstruction is rendered purely from the serialized data. Displaying the canvas directly skips that round-trip entirely.

**Rejected alternatives:** `canvas.toDataURL()` into an `<img>` (matches the existing preview `<img>`'s element type for a more uniform DOM, but reintroduces the color-drift risk for no real benefit, since both element types can be styled identically via CSS).
