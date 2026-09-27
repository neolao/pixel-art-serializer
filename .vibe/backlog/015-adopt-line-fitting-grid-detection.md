---
status: todo
---
# Adopt Line-Fitting Grid Detection

## Description
Replace the current grid-size detection algorithm (pooled run-length mode) with the grid-line-fitting + within-cell-variance-knee technique validated in the item-014 research spike (`.vibe/decisions/018-line-fitting-variance-knee-grid-detection.md`). It correctly resolves the blurred/anti-aliased-edge detection bug on a real, Product-Owner-confirmed 16×16 sample, while keeping the already-correct `pixel-art-cat.png` result unchanged.

## Acceptance Criteria
- [ ] User uploading `pixel-art-mario-sprite-blurred-border.png` (or an equivalent blurred-edge pixel-art image) sees a grid close to the confirmed 16×16, not "no grid"
- [ ] User uploading a clean, already-working pixel-art image (e.g. `pixel-art-cat.png`) still sees the same correct grid size as today
- [ ] A decision is made and recorded on how the algorithm's single shared cell size reconciles with this project's existing independent horizontal/vertical cell-size support, before or during implementation
- [ ] The suite's existing grid-detection tests (including the non-square-grid case and the "photo-like image, no consistent grid" case) still pass

## Notes
Depends on the research already done in `spikes/014-robust-grid-detection/line-fitting-variance-knee.mjs` — port/adapt that logic into `src/grid-detection.ts` via TDD rather than starting from scratch. Known, accepted follow-up (not a blocker for this item, per the Product Owner's decision during the research): `pixel-art-cat-grid-drawing.png` (art with its own drawn grid lines) regresses from a correct ~64px detection to "no grid found" — safe (no wrong answer) but not fixed; likely needs the source technique's "content bounding box" pre-step, left for a future item if it matters in practice. Priority: SHOULD.
