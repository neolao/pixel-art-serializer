# Ubiquitous Language

## Logical pixel
The "real" pixel of a piece of pixel art: a square block of one or more raw image pixels that the artist treats as a single unit. Pixel art is often distributed upscaled, so a logical pixel can span many raw pixels; a photo or an image with no consistent grid has a logical pixel size of 1 (each raw pixel is its own logical pixel).
**Do not confuse with:** raw image pixel — the individual pixels of the decoded image file, as many as its width × height.
_Sources: `src/grid-detection.ts`_

## Pixel grid
The grid formed by an image's logical pixels: its width and height expressed in logical pixels rather than raw image pixels.
_Sources: `src/grid-detection.ts`_

## Color palette
The indexed set of distinct colors a piece of pixel art actually uses, sampled one per logical pixel. Colors that differ only slightly because of compression artifacts are folded into a single palette entry rather than counted as separate colors, since pixel art conventionally uses a small, fixed set of colors.
**Do not confuse with:** raw distinct colors — every differing color found among an image's raw pixels before near-identical ones are folded together.
_Sources: `src/palette-extraction.ts`_
