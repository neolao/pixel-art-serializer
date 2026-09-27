---
status: done
---
# Manually Correct The Reconstruction

## Description
Give the user manual control over the reconstruction to fix cases the automatic detection gets wrong: editing the palette (add, remove, modify colors) and repainting individual pixels by choosing a color from the palette. The palette's first color must always represent full transparency, a constraint the current detection does not enforce.

## Acceptance Criteria
- [x] User can add a color to the palette, remove an existing color, or modify a color's value, and the reconstruction re-renders with the change
- [x] The palette's first entry always represents full transparency (alpha 0); it cannot be removed and no other color can be moved into that position
- [x] User can select a pixel in the reconstructed grid and reassign it to any color currently in the palette
- [x] The downloaded JSON export reflects every palette and pixel edit made before download

## Notes
Motivation: manually correcting a reconstruction down to a "perfect" match lets the user pair the original image with its corrected JSON as a test fixture, to improve the detection algorithm (palette indexing, pixel-size detection) over time. Fixture creation itself is out of scope for this item.
