---
status: todo
---
# Research Grid And Palette Algorithms

## Description
Items 002 (pixel grid size detection) and 003 (color palette extraction/indexing) currently have no technical grounding — no algorithm has been chosen. This item is a research spike comparing candidate algorithms for both problems so their TDD implementation can build on an informed choice instead of improvisation.

## Acceptance Criteria
- [ ] A code spike, committed in a dedicated folder outside `src/`, runs at least one candidate algorithm per problem (grid size detection, palette extraction) against sample images
- [ ] The spike distinguishes at least one pixel-art sample (known logical grid size and palette) from at least one non-pixel-art sample
- [ ] A written recommendation names the algorithm chosen for item 002 and the algorithm chosen for item 003, each with a short rationale

## Notes
Lightweight Definition of Done for this item only: no unit tests required for the spike code (exploratory/throwaway comparison code), but it must be run for real against sample images, and the written recommendation is required. Sample images (pixel-art and non-pixel-art) are supplied by the user rather than generated or sourced by the implementer. Priority: MUST — blocks 002 and 003.

Sample images supplied so far live in `fixtures/candidate-images/` (one confirmed pixel-art image, five small icons of undetermined pixel-art status). The user has said more will be sent to complete the set before implementation starts — check this folder for the latest set when starting `/vibe:feature 011`.
