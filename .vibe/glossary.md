# Ubiquitous Language

## Logical pixel
The "real" pixel of a piece of pixel art: a square block of one or more raw image pixels that the artist treats as a single unit. Pixel art is often distributed upscaled, so a logical pixel can span many raw pixels; a photo or an image with no consistent grid has a logical pixel size of 1 (each raw pixel is its own logical pixel).
**Do not confuse with:** raw image pixel — the individual pixels of the decoded image file, as many as its width × height.
_Sources: `src/grid-detection.ts`_

## Pixel grid
The grid formed by an image's logical pixels: its width and height expressed in logical pixels rather than raw image pixels.
_Sources: `src/grid-detection.ts`_
