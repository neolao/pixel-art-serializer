---
status: todo
depends_on: [003]
---
# Automatically Reduce Palette Colors

## Description
The indexed palette can end up larger than the image's real color count, e.g. due to compression noise or near-duplicate shades. Provide an automatic mode that reduces the palette to a smaller number of representative colors.

## Acceptance Criteria
- [ ] User triggers automatic reduction and the palette ends up with fewer, or the same, distinct colors
- [ ] Every pixel previously indexed to a merged-away color is reassigned to its closest remaining palette color
- [ ] Reducing an already-minimal palette leaves it unchanged rather than degrading it further

## Notes
Priority: SHOULD. Requested as a future improvement after the core MVP, split from manual merging (item 010) so each mode is independently shippable.
