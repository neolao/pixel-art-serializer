---
status: todo
depends_on: [004]
---
# Display Result Comparison And Palette

## Description
After detection, the result page must show the original uploaded image on the left and the image reconstructed purely from the extracted JSON data (grid + palette) on the right, so the user can visually compare them, plus the indexed color palette used.

## Acceptance Criteria
- [ ] Result page shows the original image and the reconstructed image side by side (original on the left, reconstruction on the right)
- [ ] The reconstructed image is rendered only from the serialized grid and palette data, not from the original image
- [ ] The indexed color palette is displayed (e.g. as color swatches) alongside the two images
- [ ] Before an image is processed, the result page shows no stale comparison from a previous upload

## Notes
Priority: MUST (part of the validated MVP scope). Refines the earlier "overlay the grid on the original image" idea into a side-by-side original vs. reconstruction comparison, per user clarification during backlog creation.
