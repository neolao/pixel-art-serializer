---
date: 2026-09-27
status: accepted
---
# Removing a palette color erases its pixels to transparent
**Context:** The manual palette editor lets the user delete a color from the palette; the pixels that used it need a new value.
**Decision:** Removing palette color `index` (never index 0) reassigns every pixel pointing to it directly to index 0 (full transparency). Surviving palette entries keep their original `index` values (no compaction), and a subsequent add allocates `max(existing indices) + 1`.
**Reason:** Confirmed with the Product Owner: manual removal is meant as an erase action, distinct from the existing automatic palette reduction (backlog item 009) and manual color merge (backlog item 010) features, which already reassign to the nearest perceptually-similar color. Stable indices avoid an O(pixels) rewrite on every removal and match the JSON format, which never assumes `index === array position`.
**Rejected alternatives:** Reassigning removed-color pixels to the nearest remaining color (mirrors items 009/010, but the Product Owner explicitly wants removal to mean "erase", not "merge"). Compacting/renumbering the palette array on removal (rejected: costs an O(pixels) rewrite of every affected cell for no data-integrity benefit).
