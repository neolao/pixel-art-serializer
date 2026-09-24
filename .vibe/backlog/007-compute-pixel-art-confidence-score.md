---
status: todo
depends_on: [002, 003]
---
# Compute Pixel Art Confidence Score

## Description
Beyond producing the raw decomposition, the tool should give a verdict on whether the image actually looks like pixel art, based on how regular the detected pixel grid is and how small the color palette is, and surface that score in the UI.

## Acceptance Criteria
- [ ] System returns a higher confidence score for an image with a regular grid and a small palette
- [ ] System returns a lower confidence score for an image with an irregular grid or a large number of colors
- [ ] The confidence score (or a derived verdict) is visible on the result page

## Notes
Priority: SHOULD. Added during backlog cadrage, not part of the original request wording.
