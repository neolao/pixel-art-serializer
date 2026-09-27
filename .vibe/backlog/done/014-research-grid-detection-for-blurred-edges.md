---
status: todo
---
# Research Grid Detection For Blurred Edges

## Description
The current grid-size detection algorithm (pooled full-line run-length mode, `.vibe/decisions/002-grid-and-palette-algorithms.md` and `.vibe/decisions/004-grid-detection-pooled-line-scanning.md`) reports "no grid" on real pixel-art images whose logical-pixel edges are soft/anti-aliased rather than sharp — this is an already-documented, deliberately deferred limitation in both decisions, now confirmed reproducible on a real Product-Owner-supplied sample with a known 16×16 grid. This item is a research spike comparing candidate detection approaches, in the same spirit as the original algorithm research, before any production code changes.

## Acceptance Criteria
- [ ] A code spike, committed in a dedicated folder outside `src/`, compares at least two candidate detection approaches against every image in `fixtures/candidate-images/` plus the new blurred/bordered sample
- [ ] The spike still correctly reports "no grid" for the confirmed non-pixel-art icon samples and the correct known cell size for the already-working pixel-art samples (no regression)
- [ ] The spike detects a grid close to the confirmed 16×16 logical grid on the new blurred/bordered sample
- [ ] A written recommendation names the chosen approach with its rationale, or explains why no candidate is viable yet

## Notes
Lightweight Definition of Done for this item only, matching item 011's precedent: no unit tests required for the spike code itself, but it must be run for real against the sample images, and the written recommendation/decision record is required before `src/grid-detection.ts` is touched. The new blurred/bordered sample image should be added to `fixtures/candidate-images/` as part of this work. Priority: SHOULD — blocks a full fix of the reported grid-detection bug, but the app already works correctly on clean pixel art without it.
