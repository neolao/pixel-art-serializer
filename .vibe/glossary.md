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

## Reconstruction
The image rebuilt purely from the detected pixel grid and color palette, one flat-colored block per logical pixel, with no reference back to the original image's raw pixels. Shown next to the original upload so a person can visually judge whether the detected grid and palette actually capture the artwork, and can manually correct it by editing the palette or repainting individual pixels when detection got it wrong.
**Do not confuse with:** the original uploaded image — the source the grid and palette were detected from in the first place.
_Sources: `src/result.ts`, `src/reconstruction-editor.ts`_

## Reserved transparent color
The color palette's first entry, always present and always fully transparent, regardless of whether the source image has any transparency of its own. Lets a person erase a reconstructed pixel to transparent even on a fully-opaque image. It can never be removed, changed to another color, or displaced from that position by another color.
**Do not confuse with:** a color palette that happens to contain a transparent entry because the source image itself uses transparency — this one is always present on top of whatever the image actually contains.
_Sources: `src/palette-extraction.ts`, `src/palette-editor.ts`_

## Manual grid adjustment
Correcting the detected pixel grid by hand: dragging a resizable selection over the original image to pick which area is the real artwork (excluding, for example, a decorative border), and setting the exact width/height in logical pixels. Confirming it re-runs the palette, reconstruction, confidence verdict, and downloadable JSON on that chosen area and size instead of the automatically detected ones; a dedicated action reverts to the automatic result at any time.
**Do not confuse with:** manually correcting the reconstruction (editing the palette or repainting individual pixels) — that changes color content after the grid is already fixed; this changes the grid itself.
_Sources: `src/manual-grid-editor.ts`, `src/grid-selection.ts`, `src/image-crop.ts`_

## Confidence score
A verdict on whether an uploaded image actually looks like pixel art, combining how regular its detected pixel grid is with how small its color palette is. Expressed as a percentage plus a plain-word verdict and a short explanation of which of the two signals is weak when they disagree.
**Do not confuse with:** grid regularity or palette size alone — each is only one of the two signals the confidence score combines.
_Sources: `src/confidence.ts`_
