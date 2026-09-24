---
date: 2026-09-24
status: accepted
---
# Palette extraction samples one pixel per grid cell instead of averaging

**Context:** Implementing item 003 (color palette extraction) on top of decision `002-grid-and-palette-algorithms`'s chosen approach (perceptual-merge in Lab, threshold 10, run on one representative color per logical grid cell from item 002's output, not on raw pixels). The spike never built the down-sampling step itself — it only ran the merge on raw pixel data as a stress test — so how to turn a grid cell into a single representative color was left open.

**Decision:** For each logical grid cell, sample the single raw pixel nearest the cell's center (nearest-neighbor), rather than averaging every raw pixel inside the cell.

**Reason:** Item 002's own detection is point-sample based and documented as accurate only to within roughly ±1px jitter around a cell's true boundary, so a cell's edge pixels are the least trustworthy ones to include. Averaging the whole cell would blend those uncertain edge/anti-aliased pixels into a new blended color that may not exist anywhere in the source artwork — working against this ticket's own goal of not inventing extra palette entries. A center sample stays clear of the uncertain boundary and reads a pixel that is, by construction, deep inside the cell.

**Rejected alternatives:**
- Averaging all raw pixels within a cell — rejected: risks producing synthetic blended colors from boundary/anti-aliasing pixels, adding noise instead of removing it.
- Most-frequent raw color within a cell (per-cell mode) — rejected for now: adds implementation complexity with no real-sample-image evidence yet that center-sampling is insufficient; can be revisited if a real image demonstrates the gap.
