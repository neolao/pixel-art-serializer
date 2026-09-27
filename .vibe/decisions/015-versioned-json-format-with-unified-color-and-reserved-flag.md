---
date: 2026-09-27
status: accepted
---
# The exported JSON gains a format version, a unified color field, and an explicit reserved-entry flag

**Context:** A design review of the downloadable JSON (`serializePixelArt`'s output) found it had no version marker, encoded one color across two separate fields (`hex` + `alpha`), and gave no visible signal that the palette's index-0 entry is permanently reserved for full transparency — all invisible to an external consumer who only has the file itself, not the source code or its ADRs.

**Decision:**
- Add a top-level `formatVersion: number` field, starting at `1`.
- Replace `hex: string` + `alpha: number` on each palette entry with a single `color: string`, an 8-digit hex string (`#rrggbbaa`) — the same encoding the app already builds ad hoc wherever it composites a color for canvas/CSS use.
- Add `reserved: boolean` on every palette entry (`true` only for index 0, `false` otherwise), instead of leaving that invariant implicit.

**Reason:** A file meant to be consumed outside the app should be self-describing: a consumer should not need to read the source code or its decision records to know the file's shape can change, how a color is encoded, or which entry is permanent. `#rrggbbaa` was chosen over an `{r,g,b,a}` object because the codebase already builds exactly this string shape internally (canvas `fillStyle`, CSS `backgroundColor`) — reusing it removes a conversion step rather than adding a new encoding convention.

**Rejected alternatives:** An `{r, g, b, a}` object per color (equally valid, but introduces an encoding the codebase doesn't already use anywhere, and is more verbose for no behavioral gain). Keeping `hex`/`alpha` as deprecated aliases alongside the new `color` field (rejected: doubles the file's color data for every entry going forward, and blurs which field a consumer should trust). A numeric `reservedIndex: 0` field naming the reserved index once, instead of a per-entry boolean (rejected: forces a consumer to cross-reference an index against every entry rather than reading a single entry's own flag).
