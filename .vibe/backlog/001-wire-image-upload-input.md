---
status: todo
---
# Wire Image Upload Input

## Description
The `#image-input` file field currently exists in the UI but has no handler. Selecting an image must load it and show a preview, as the entry point for every downstream detection step.

## Acceptance Criteria
- [ ] User selects an image file and sees it previewed in the page
- [ ] User selecting a non-image file sees a clear error message and no broken preview
- [ ] The loaded image is exposed in a form the detection logic can consume (e.g. an `HTMLImageElement` or `ImageData`)

## Notes
Priority: MUST.
