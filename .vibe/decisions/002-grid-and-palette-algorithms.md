---
date: 2026-09-24
status: accepted
---
# Chosen algorithms for pixel grid size detection and color palette extraction

**Context:** Backlog items 002 (grid size detection) and 003 (palette extraction) had no technical grounding. A spike (`spikes/011-grid-and-palette-algorithms/`) implemented two candidate algorithms per problem, sourced from published pixel-art tooling and research rather than invented from scratch, and ran them for real against the 8 images in `fixtures/candidate-images/` (3 confirmed pixel-art, 5 small icons treated as non-pixel-art per Product Owner confirmation).

## Grid size detection (item 002)

**Decision:** Sample-point run-length detection — sample a 4x4 grid of points across the image, walk outward from each to measure the run length between color changes (tolerance ~3 per RGB channel), and take the **median of each point's own most frequent run length** (not a single pooled mode across all points) as the horizontal/vertical cell size.

**Reason:** Directly compared against block-uniformity detection (partition the image into candidate n×n blocks and keep the largest n for which almost every block is a uniform color), sourced from a 2026 pixel-art rescaling paper. On `pixel-art-cat.png` (1152×630), row inspection showed real cell runs of 38–40px with ±1px jitter and a non-multiple offset before the first transition — consistent with a non-integer original scale factor. Sample-point detection correctly read this as a 39px grid; block-uniformity, which assumes blocks start exactly at pixel (0,0), only matched at n=2 because the ±1px jitter breaks strict block alignment at any larger size. Per-point median (rather than one pooled mode) was also needed: pooling every run length globally let a single noisy sample point (see rejected alternative) dominate the result.

**Known limitation, left for item 002's implementation:** on `pixel-art-mario-sprite.png`, a blurred multicolor background strip visible around the sprite produces mostly 1px run lengths; several of the 16 sample points land on it, and even the per-point median voting fails to recover the true grid (result: size 1, i.e. "no grid detected", on a confirmed pixel-art sample). A production implementation should discard sample points whose local run lengths don't show a stable repeating pattern before taking the median, instead of trusting every point equally.

**Rejected alternatives:**
- Block-uniformity as the primary signal — rejected: fails on any image whose grid isn't pixel-perfectly aligned to origin (0,0), which is common for web-distributed pixel art resized by a non-integer factor.
- Pooling every sample point's run lengths into one global mode — rejected: a single point sitting on a noisy/textured region can outvote every other point (observed on the mario sample before switching to per-point median).

## Color palette extraction (item 003)

**Decision:** Perceptual-distance agglomerative merge — convert each distinct raw color to CIE Lab, repeatedly merge the two closest colors (weighted average) while their Lab (CIE76) distance stays under a threshold of 10, run **after** down-sampling the image to one representative color per detected logical grid cell (item 002's output), not on raw per-pixel data.

**Reason:** Directly compared against median-cut quantization to a fixed target size (K=16), the classic 1980 color-quantization algorithm. On the two clean pixel-art samples (`pixel-art-cat.png`, `pixel-art-cat-grid-drawing.png`), both raw distinct-color counts were already small (14, 15) — likely because the source images were scaled without heavy smoothing — and perceptual merge sensibly reduced them further (10, 12) by folding in near-duplicate anti-aliasing colors, matching the ticket's "near-identical colors from compression artifacts" requirement; median cut, needing K fixed in advance, cannot discover this on its own. The determining case was `pixel-art-mario-sprite.png`: its raw per-pixel color count was 35,153 (a blurred background texture, not the sprite itself), which median cut forces down to a meaningless, arbitrary 16 colors mixing sprite and background, while even perceptual merge alone only reached 147 — still far too many. This confirms the backlog's own dependency note: palette extraction needs to run on one sample per **logical pixel cell** from item 002's grid, not on raw image pixels; the spike's raw-pixel comparison mode is unrepresentative of the real pipeline and is kept only as a stress test.

**Practical implementation note:** the perceptual merge is O(n²) per merge step; the spike had to pre-bucket raw colors (coarse RGB rounding) before merging whenever the raw distinct count exceeded 500, purely to keep the noisy-background stress test runnable. This should not be needed once extraction runs on grid-cell samples instead of raw pixels, but the implementation should still guard against pathological inputs.

**Rejected alternatives:**
- Median-cut / fixed-K clustering as the primary signal — rejected: requires deciding the palette size before knowing it, which is exactly what item 003 needs to discover, and produced a visibly wrong result on the noisy sample.
- Running palette extraction directly on raw image pixels (as the spike does for comparison) — rejected as the production approach: demonstrated to blow up on any non-flat region; item 003 should consume item 002's logical grid first.

## Confidence score note (relevant to item 007)

Palette size alone does not distinguish pixel art from non-pixel-art: the 5 icon samples (confirmed non-pixel-art, native resolution) had raw palettes of only 5–8 colors, as small as the genuine pixel-art samples. Item 007's confidence score must weigh grid regularity (item 002) alongside palette size (item 003), not palette size in isolation.
