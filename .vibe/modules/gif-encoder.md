# Module: gif-encoder

**Role:** Encodes a serialized pixel-art result into real GIF89a file bytes, so it can be offered as a second download format alongside the JSON.
**Files:** `src/gif-encoder.ts`
**Exports:** `encodeGif(serialization: PixelArtSerialization): GifEncodingResult`, `MAX_GIF_COLORS`, type `GifEncodingResult`
**Depends on:** `modules/serializer.md`

Pure function, no DOM dependency. Built on the small, dependency-free `omggif` library (`GifWriter`) rather than a hand-rolled LZW encoder — see `.vibe/decisions/022-gif-export-via-omggif.md`. Every pixel is remapped from its stable palette `index` to that color's current position in the GIF color table, since indices can have gaps after a manual removal (the same concern `modules/result.md`'s `renderReconstruction` handles). The serialization's reserved transparent entry is always marked as the GIF's one transparent index; every other color is written from its RGB channels alone — GIF has no partial transparency, so a non-reserved color with less than full alpha is written fully opaque, and this is reported back as `hasFlattenedColor` for `modules/result.md` to surface to the user — see `.vibe/decisions/023-gif-export-flattens-non-reserved-alpha.md`. Throws when the palette has more than `MAX_GIF_COLORS` (256) entries, GIF's hard color-table limit. Covered by automated tests that decode the produced bytes back with `omggif`'s independent `GifReader`, never the encoder's own logic, including the index-remapping case, the flattening case, and both sides of the 256-color boundary.
