---
status: todo
depends_on: [011]
---
# Extract And Index Color Palette

## Description
Pixel art conventionally uses a small, fixed set of colors. The tool must extract the distinct colors used in the image (at the logical pixel grid level) and index them into a palette, since a large or unbounded number of colors is a signal against pixel art.

## Acceptance Criteria
- [ ] System returns an indexed list of the distinct colors found in the image
- [ ] Near-identical colors caused by compression artifacts are not counted as separate palette entries
- [ ] System reports the total number of distinct colors found

## Notes
Priority: MUST. Conceptually needs the logical grid from item 002, though no explicit ordering constraint was given.
