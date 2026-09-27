---
date: 2026-09-27
status: accepted
---
# Grid regularity computed inside grid detection, not recomputed elsewhere

**Context:** Implementing the pixel-art confidence score (backlog item 007), the score needs a measure of how regular the detected pixel grid is — how consistently the same block size repeats across the image.

**Decision:** Extend `detectPixelGridSize`'s result with a `gridRegularity` field (the share of scanned horizontal/vertical runs that match the detected pixel size), computed from the same run-length data the function already gathers internally, rather than having the new confidence module re-scan the image's pixels itself.

**Reason:** The raw run-length distribution needed to judge regularity only exists inside `detectPixelGridSize` today and is discarded once the winning size is picked; recomputing it elsewhere would duplicate the scanning logic (and its own tuning, e.g. `MAX_SCAN_LINES`) for no benefit.

**Rejected alternatives:** A separate function that independently re-scans the image's pixel data to derive regularity — rejected as duplicated, drifting logic; deriving regularity only from the final `pixelSize`/`gridWidth`/`gridHeight` numbers (e.g. checking exact divisibility) — rejected as a much weaker signal than the actual run-length agreement already computed.
