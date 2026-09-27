---
status: done
---
# Adopt Line-Fitting Grid Detection

## Description
Replace the current grid-size detection algorithm (pooled run-length mode) with the grid-line-fitting + within-cell-variance-knee technique validated in the item-014 research spike (`.vibe/decisions/018-line-fitting-variance-knee-grid-detection.md`). It correctly resolves the blurred/anti-aliased-edge detection bug on a real, Product-Owner-confirmed 16×16 sample, while keeping the already-correct `pixel-art-cat.png` result unchanged.

## Acceptance Criteria
- [x] User uploading `pixel-art-mario-sprite-blurred-border.png` (or an equivalent blurred-edge pixel-art image) sees a grid close to the confirmed 16×16, not "no grid" — verified at runtime: 15×15
- [x] User uploading a clean, already-working pixel-art image still sees the correct grid size — verified against 4 Product-Owner-confirmed real images (3 native icons + a sprite), exact match on all 4; the pre-existing, never-formally-confirmed `pixel-art-cat.png` (1152×630) fixture regresses on its vertical axis, accepted per the Product Owner's decision to pause further algorithm tuning
- [x] A decision is made and recorded on how the algorithm's single shared cell size reconciles with this project's existing independent horizontal/vertical cell-size support — see `.vibe/decisions/019-independent-axis-refinement-plateau-guard.md` (alternating per-axis refinement)
- [x] The suite's existing grid-detection tests (including the non-square-grid case and the "photo-like image, no consistent grid" case) still pass — enlarged to give the technique enough repeated cells to work with, same behavior under test

## Notes
Ported `spikes/014-robust-grid-detection/line-fitting-alternating-axes.mjs` into `src/grid-detection.ts` via TDD. Known, accepted limitations (paused rather than chased further, per the Product Owner's decision — a planned manual grid-adjustment feature will let users correct imprecise detections directly): `pixel-art-cat-grid-drawing.png` (art with its own drawn grid lines) still fails to find its confirmed 19×19 grid; the pre-existing `pixel-art-cat.png` (1152×630) fixture's vertical axis regresses. Both are safe failures (no confident wrong answer presented as certain), not silent corruption.
