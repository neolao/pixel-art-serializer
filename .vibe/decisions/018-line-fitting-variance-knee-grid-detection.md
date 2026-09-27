---
date: 2026-09-27
status: accepted
---
# A third candidate — grid-line fitting with a variance knee — resolves the blurred-edge case

**Context:** Continuing the same research spike as `decisions/017-blurred-edge-grid-detection-still-unsolved.md` (backlog item 014), a third technique was found by searching for published, real-world approaches to the same problem (per this project's established practice of sourcing algorithms rather than inventing from scratch): the grid-detection technique in the open-source `sindri-pixel` project (github.com/vardirhq/sindri-pixel/pull/13), built for the related problem of recovering an implied grid from AI-generated pseudo-pixel-art. That repository declares no license, so the technique was reimplemented from its public description/diff rather than copied, and adapted (single shared cell size for both axes, matching the source, rather than this project's usual independent horizontal/vertical detection — see Left for future work).

Along the way, direct visual review of the fixture set (prompted by the Product Owner questioning the "5 confirmed non-pixel-art icons" fixtures from `decisions/002`) revealed that classification was wrong: all 5 are genuine pixel art at native resolution, not non-pixel-art. They were renamed accordingly (`pixel-art-icon-*-native.png`); this correction is noted here rather than editing `decisions/002` (append-only).

**Decision:** Adopt the grid-line-fitting + within-cell-variance-knee technique as the recommended replacement for the current pooled run-length mode, pending its production implementation (tracked separately). Supersedes decision-017's "keep baseline unchanged" conclusion.

**Reason:** Instead of counting same-color run lengths, this technique places grid lines (via dynamic programming) on the strongest local color-change edges for each candidate cell size, letting spacing drift within a tolerance rather than assuming a rigid, unshifted lattice — folding offset search and jitter tolerance into one step. The true cell size is read off a sharp jump ("knee") in within-cell color variance as candidate size grows past it, not a raw frequency count — avoiding the small-candidate-size domination that sank both candidates in decision-017.

Run for real against the full, corrected fixture set:
- **The reported bug's sample** (`pixel-art-mario-sprite-blurred-border.png`, confirmed 16×16): detects a 15×15 grid at 44px cells, high confidence — resolved, versus total failure today.
- **`pixel-art-cat.png`** (known-correct today at ~38-39px): still detects 39px, high confidence — no regression.
- **`pixel-art-mario-sprite.png`** (previously unknown/broken): now detects a plausible 16×16 grid, medium confidence.
- **The 5 reclassified native-resolution icons**: no confirmed regression (their true grid size is unknown, so a small detected size can no longer be judged wrong on classification grounds alone) — an initial run without a minimum candidate cell size did produce spurious size-2 detections here, fixed by restricting candidate sizes to ≥8px, justified empirically: every confirmed real cell size across this project's whole fixture set is ≥38px, and very small candidate sizes are structurally prone to false positives (their multiples/tolerance windows leave too little room to distinguish real structure from a coincidence) — this matches the same failure mode diagnosed for the harmonic candidate in decision-017.
- **`pixel-art-cat-grid-drawing.png`** (known-correct today at ~64px): regresses to "no grid found" (not a wrong grid — the ≥8px guard prevents that — just none). Root cause: this image has grid lines *drawn* onto the art itself, creating their own small-scale repeating edge pattern that a plain per-image sweep cannot distinguish from the real ~64px logical grid. The Product Owner accepted this trade-off (net gain: the reported bug and two other samples improve or hold; net loss: this one specific pre-existing case now degrades safely to "unknown" instead of succeeding) to unblock production adoption, with the fix for this case left as follow-up.

**Rejected alternatives:** the two candidates from decision-017 (see that file); porting the source's own "content bounding box" step to fix the grid-drawing regression immediately — deferred, since it did not affect the reported bug and the Product Owner chose to accept the trade-off now rather than extend the spike further.

**Left for future work:**
1. Production implementation (TypeScript, in `src/grid-detection.ts`), including test coverage and real-runtime verification — tracked as backlog item 015.
2. This implementation assumes one shared cell size for both axes; this project's current algorithm supports independent horizontal/vertical sizes (see its own non-square-grid test). Reconciling the two — e.g. a full 2D (cell-width, cell-height) sweep instead of one shared candidate — is unexplored and should be scoped before or during the item 015 implementation, not assumed away.
3. The `pixel-art-cat-grid-drawing.png` regression (art with its own drawn grid lines defeating detection) — likely fixable by porting the source's "content bounding box" pre-step, or a similar way to separate decorative line art from the logical pixel grid; left for whoever picks up item 015 or a dedicated follow-up.
