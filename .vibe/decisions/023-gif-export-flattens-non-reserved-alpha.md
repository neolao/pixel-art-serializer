---
date: 2026-09-28
status: accepted
---
# GIF export represents only the reserved palette entry as transparent; any other partial alpha is flattened to opaque

**Context:** The app's own format (JSON) can express a per-color alpha for every palette entry, including a non-reserved color that ended up genuinely semi-transparent (see `.vibe/decisions/014-merged-alpha-takes-the-most-opaque-sample.md`). GIF's transparency model is binary and single-index: a Graphic Control Extension can name at most one palette index as fully transparent; every other index is always fully opaque.

**Decision:** When encoding a GIF, only the serialization's reserved transparent entry (`.vibe/decisions/011-palette-always-reserves-transparent-index-zero.md`) is marked as the GIF's transparent index. Any other palette color is written to the GIF's color table using its RGB channels alone; its alpha, if less than fully opaque, is ignored for the GIF only — the JSON export is never affected by this.

**Reason:** This is a hard constraint of the GIF format, not a design preference — there is no way to encode a second, independently semi-transparent color in a GIF. A non-reserved palette color carrying partial alpha is itself already an edge case in this app's own domain: genuine pixel art has flat, fully opaque colors everywhere except the reserved transparent entry, so a semi-transparent non-reserved entry in practice signals either an imperfect grid/palette detection or a source image that isn't really pixel art — not a legitimate style choice to preserve faithfully. Flattening it to opaque (rather than refusing to export, or forcing it to fully transparent) keeps the color's hue and general appearance intact, the closer visual match to the original for what is already a degraded input. The result screen surfaces this to the user as a standing, non-blocking, neutrally-worded note whenever it applies, so the discrepancy with the JSON is never silent.

**Rejected alternatives:** Refusing GIF export whenever any non-reserved color has partial alpha — rejected as disproportionate; the JSON export already carries this same input faithfully, and blocking only the GIF side would be an inconsistent, surprising failure for what is a cosmetic limitation of one export format. Forcing such a color to fully transparent instead of opaque — rejected because it would erase the color entirely from the visible image rather than approximate it.
