---
status: todo
depends_on: [002, 003]
---
# Serialize Pixel Grid To JSON

## Description
Once the logical pixel grid and the indexed color palette are known, the tool must serialize them into a single JSON description of the image: grid dimensions, the color palette, and the color index of every logical pixel.

## Acceptance Criteria
- [ ] Generated JSON includes the logical grid width and height
- [ ] Generated JSON includes the indexed color palette (e.g. hex codes)
- [ ] Generated JSON includes, for every logical pixel, the index of its color in the palette
- [ ] JSON produced for a known test image matches the expected grid and palette exactly

## Notes
Priority: MUST.
