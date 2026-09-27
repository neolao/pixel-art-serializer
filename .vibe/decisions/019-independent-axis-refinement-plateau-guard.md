---
date: 2026-09-27
status: accepted
---
# Line-fitting grid detection kept independent per axis via a two-pass refinement, guarded by plateau length

**Context:** Implementing backlog item 015 (adopting decision 018's line-fitting + variance-knee technique in production) had to resolve that decision's open question: the source technique sweeps one candidate cell size shared by both axes, but this project's `detectPixelGridSize` has always supported independent horizontal/vertical sizes (an existing passing test covers a non-square grid), and confidence/serialization code expects that shape to stay unchanged.

**Decision:** Run the joint (shared-candidate) sweep once to get a starting line fit, then refine each axis independently: hold the *other* axis's fitted lines fixed and re-sweep just this axis's candidate sizes using real 2D box variance, settling each axis to its own cell size. Accept a knee only when the candidate has been on a low-variance "plateau" for at least 2 consecutive sizes, not just found low at a single point (`PLATEAU_MIN_RUN`), instead of a raised minimum candidate size.

**Reason:** A raised minimum candidate size (the spike's stopgap, ≥8px) was tried first and does prevent false positives on tiny real icons — but it also hides a genuine 5px cell in this project's own existing non-square-grid test, since that test's small cell size is smaller than the guard. Checked directly: the spurious icon detections all resolved on a *single* candidate point (only size 2 itself before jumping), while both real synthetic cell sizes (10px and the non-square case's 5px/8px) sit on a plateau spanning several consecutive candidate sizes before their jump — because the technique's own ±25% line-spacing drift tolerance makes nearby candidate sizes converge to the same fitted lines, so a genuine grid's plateau is wide by construction, while noise's is not. Requiring plateau length ≥2 keeps the real 5px/8px/10px cases and rejects every tested false positive, without excluding any legitimate small cell size.

Verified for real (not just reasoned): re-ran the full fixture set plus enlarged synthetic cases (uniform grid, non-square grid, noisy/no-grid image, tiny native-resolution image, a grid with one distorted pixel) with this exact approach — all pass; the reported bug's sample still resolves to a 15×15 grid at high confidence; `pixel-art-cat.png` still detects its known ~38-39px size on both axes independently.

**Rejected alternatives:** a full 2D (cell-width × cell-height) joint sweep — would find the true independent sizes directly but multiplies the already non-trivial per-axis search cost by itself, unnecessary once the two-pass refinement was shown to work; a raised minimum candidate size alone — rejected per the reason above (breaks an existing, still-desired test case).

**Known consequence, already accepted:** the enlarged synthetic test fixtures needed for this technique to have enough headroom past the true cell size (enough repeated cells) mean the existing grid-detection unit tests use bigger synthetic images than before — same behavior under test, different fixture size.
