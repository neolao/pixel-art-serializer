---
date: 2026-09-27
status: accepted
---
# A merged palette color's opacity takes the most opaque of its merged samples, not their average

**Context:** Fixing backlog item 012 — a color sampled from an anti-aliased source edge (e.g. a black outline) can carry a partial alpha (observed ~142/255) purely as a sampling artifact, even though the same logical color is fully opaque everywhere else it appears. Pixel art is expected to use flat, fully opaque colors, so this noise should not surface as a semi-transparent palette entry.

**Decision:** When the perceptual color merge (`mergePerceptuallyCloseColors`) combines two near-identical samples, their alpha channel is combined by taking `Math.max` of the two, not a count-weighted average (RGB channels are unaffected, still averaged).

**Reason:** A raw sample landing on an anti-aliased pixel reports a lower alpha than its perceptually-identical, fully-opaque neighbors purely because of where it happened to be sampled — the most opaque sample in a merged group reflects the color's true, intended opacity. A color that is genuinely and consistently semi-transparent (e.g. a deliberately translucent tile) never merges with a fully-opaque sample in the first place, since nothing perceptually identical to it is ever fully opaque — so this rule never overrides an intentional partial alpha.

**Rejected alternatives:** Keeping the count-weighted average (the original behavior — directly causes the bug, since a lone noisy sample pulls the whole merged color's alpha down). A fixed alpha threshold (e.g. "round up to opaque above 90%") — rejected because the observed noise value (~142/255, ~56%) sits far below any threshold that wouldn't also risk rounding up a legitimately half-transparent color.
