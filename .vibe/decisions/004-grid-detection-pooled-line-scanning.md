---
date: 2026-09-24
status: accepted
---
# Grid detection pools run lengths across many full scan lines

**Context:** Implementing item 002 from decision `002-grid-and-palette-algorithms`'s chosen approach (sample-point run-length detection, forward-only scan from 16 sample points, per-point median of the most frequent run length). Porting it into tested production code (`src/grid-detection.ts`) surfaced real problems, each reproduced with either a synthetic test fixture or the actual sample images in `fixtures/candidate-images/`.

**Decision:** Scan up to 24 full rows and 24 full columns spread evenly across the image, record every same-color segment length along each line (not just runs seen from a single sample point), pool all the row-scan lengths together and all the column-scan lengths together, and take the single most frequent length (the mode) on each axis as the cell size.

**Reason:** Two rounds of findings, in order:
1. **Original per-point approach:** a scan finding only two transitions (a partial run from the sample point's arbitrary phase, then one full-period run) let the mode's tie-break pick the phase-dependent partial run over the true period (detected a 10px test grid as 5px); a scan needing two full periods before discarding that partial run starved sample points placed in a grid with few rows/columns of any usable measurement.
2. **First fix attempt (bidirectional "island width" around each point):** fixed both synthetic-test failures, but checked against the real sample images it did worse than the original spike — a sample point landing in a large uniform background (e.g. most of `pixel-art-cat.png`'s canvas) measured that background's size instead of the grid's, and points landing near anti-aliased icon edges measured the anti-aliasing band instead of reporting "no grid".

Pooling full-line run lengths across many lines and taking the plain frequency mode fixes both: the true cell size recurs on almost every line that crosses the artwork, so it wins on raw count, while a large background region or a soft anti-aliasing gradient only ever contributes a handful of one-off lengths that can't compete. Verified against all 6 unit tests (nominal grid, non-square cells, noisy/no-grid image, tiny native-resolution image, both invalid-input cases) and against the 8 real sample images: all 5 non-pixel-art icons now correctly report no grid, and `pixel-art-cat.png` matches the ~39px cell size found by direct inspection during the original research spike.

**Known limitation carried over from decision `002`:** `pixel-art-mario-sprite.png` still reports no grid. Its blurred, heavily-noised background contributes so many short, competing run lengths that none of them — nor the sprite's true, larger cell size — forms a clear plurality across the sampled lines. This is the same limitation already flagged as future work in decision `002`.

**Rejected alternatives:** weighting each run length by the total pixels it covers instead of by raw occurrence count (to favor large regions) — rejected because it reintroduced the background-domination problem the coverage weighting was meant to avoid, verified directly against the sample images; the bidirectional per-point "island width" measurement — rejected per finding 2 above, despite passing every synthetic unit test, because it regressed on real images.
