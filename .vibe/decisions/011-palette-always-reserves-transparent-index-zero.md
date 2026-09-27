---
date: 2026-09-27
status: accepted
---
# Palette always reserves a transparent color at index 0
**Context:** Manual correction of the reconstruction needs a way to erase a pixel to full transparency, independently of whether the source image used any transparency at all.
**Decision:** `extractColorPalette` always synthesizes a `{r:0,g:0,b:0,a:0}` entry as index 0, even for fully-opaque source images. Any raw sample with `alpha === 0` collapses into this same index 0 regardless of its RGB, resolved before the perceptual merge of the remaining (opaque) colors runs.
**Reason:** The editing feature requires a always-available "eraser" color; making it conditional on the source image would leave images with no detected transparency unable to be edited to transparent pixels.
**Rejected alternatives:** Only promoting an existing sampled transparent color to index 0 when one is detected — rejected because it leaves opaque-only images with no transparent option at all.
