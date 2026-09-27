---
status: todo
depends_on: [003]
---
# Manually Merge Palette Colors

## Description
Give the user manual control over the palette: they can select several colors in the displayed palette and merge them into one, for cases where automatic reduction (item 009) doesn't produce the grouping they want.

## Acceptance Criteria
- [ ] User can select two or more palette colors
- [ ] User can merge the selected colors into a single color, chosen from the selection
- [ ] Every pixel previously indexed to a merged color is reassigned to the resulting merged color
- [ ] Merging is reflected in the displayed palette, the reconstructed image, and the downloadable JSON

## Notes
Priority: SHOULD. Requested as a future improvement after the core MVP, split from automatic reduction (item 009) so each mode is independently shippable.
