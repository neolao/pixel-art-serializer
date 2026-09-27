---
date: 2026-09-27
status: accepted
---
# Per-pixel palette index assigned by nearest color, not by merge provenance

**Context:** Implementing JSON serialization (backlog item 004), every logical pixel must carry the index of its color in the already-extracted, already-merged palette. The existing palette extraction groups grid cells by exact color match before merging near-identical shades together, and does not retain, per grid cell, which final merged entry it ended up in — that link is discarded during the merge.

**Decision:** Re-sample each grid cell's representative color independently (the same cell-center sampling already used to build the palette), then assign it to the palette entry closest to it in Lab color space, rather than tracking merge provenance through the palette-extraction pipeline.

**Reason:** Every color a cell can produce is, by construction, closer to the palette entry it was folded into (or to itself, if unmerged) than to any other entry — the merge step already guarantees this. Re-deriving the mapping this way needs no change to the palette-extraction pipeline's internals, and matches the reassignment approach already planned for the future palette-reduction backlog items (009, 010: "every pixel previously indexed to a merged-away color is reassigned to its closest remaining palette color").

**Rejected alternatives:** Threading cell-position bookkeeping through `extractColorPalette`'s merge loop so each cell keeps a live reference to its final merged entry — rejected because it would complicate a pipeline that currently has no notion of cell position at all, for a result nearest-color lookup already gives correctly.
