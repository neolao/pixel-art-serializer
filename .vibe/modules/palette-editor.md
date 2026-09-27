# Module: palette-editor

**Role:** Pure edit operations on an already-serialized pixel-art result: add, remove, or modify a palette color, and recolor a single pixel — each returning a new `PixelArtSerialization` rather than mutating the input.
**Files:** `src/palette-editor.ts`
**Exports:** `addPaletteColor(serialization, color: EditableColor): PixelArtSerialization`, `removePaletteColor(serialization, index: number): PixelArtSerialization`, `modifyPaletteColor(serialization, index: number, color: EditableColor): PixelArtSerialization`, `recolorPixel(serialization, pixelPosition: number, paletteIndex: number): PixelArtSerialization`, type `EditableColor`, constant `TRANSPARENT_INDEX`
**Depends on:** `modules/serializer.md`

No DOM dependency; covered entirely by automated tests. `TRANSPARENT_INDEX` (0) can never be removed or modified — both operations are no-ops on it, matching `modules/palette-extraction.md`'s reserved transparent entry (`.vibe/decisions/011-palette-always-reserves-transparent-index-zero.md`). `removePaletteColor` erases every pixel pointing at the removed color to `TRANSPARENT_INDEX`, rather than reassigning to the nearest perceptually-similar color — a deliberate difference from the automatic-reduction and manual-merge features, since manual removal is meant as an erase action (`.vibe/decisions/012-remove-palette-color-erases-to-transparent.md`). Surviving palette entries keep their original `index` (never compacted), and `addPaletteColor` allocates `max(existing indices) + 1`, so a later add can't collide with an index a prior removal left behind.
