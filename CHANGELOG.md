# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- Fixed pixel grid detection reporting no grid at all on a hand-drawn grid-chart style image (gridlines over shaded, non-flat cell interiors), where the true cell size was previously ruled out for sitting on a stable-but-noisy plateau rather than a clean low-variance one.

## [0.12.1] - 2026-09-28

### Fixed

- Fixed the manual grid adjustment not responding to touch on mobile devices — dragging the selection or its handles with a finger now works the same as with a mouse.

## [0.12.0] - 2026-09-28

### Added

- The reconstruction now shows its detected grid size (width × height, in logical pixels), so users can immediately see how the image was decomposed.
- Pixel grid detection is now far more reliable on real-world pixel art with soft, anti-aliased edges (for example a photographed or re-compressed sprite): it used to report no grid at all on such images, and now finds one very close to the real size.
- Users can now manually correct the detected grid: an "Adjust grid manually" button reveals a selection rectangle over the original image, with draggable/resizable handles (mouse or keyboard) and a width/height field, to crop out unwanted borders or fix a wrong cell count. Confirming re-runs the reconstruction, confidence verdict, and JSON download on the chosen area; "Return to automatic detection" reverts to the original result at any time.

## [0.11.0] - 2026-09-27

### Added

- The downloaded JSON now includes a format version number, and describes each palette color as a single, self-contained value instead of two separate pieces. The palette's permanent, always-transparent entry is now explicitly marked as such. A published, machine-checkable schema lets other programs validate a downloaded file automatically, alongside a written explanation of the file's shape for anyone reading it by hand.

## [0.10.1] - 2026-09-27

### Fixed

- Fixed a color sampled from an anti-aliased edge (e.g. a black outline) rendering semi-transparent instead of solid — it now reports full opacity whenever the same color is fully opaque elsewhere in the image, while a color that is genuinely and consistently semi-transparent throughout keeps its own opacity unchanged.

## [0.10.0] - 2026-09-27

### Added

- Users can now manually merge two or more palette colors into one they choose from the selection, for cases where automatic grouping doesn't produce the result they want. Every pixel pointing at a merged-away color is reassigned to the surviving color, reflected in the palette, the reconstruction, and the downloadable JSON. If the color currently active for painting gets merged away, painting continues seamlessly with the surviving color.

## [0.9.0] - 2026-09-27

### Added

- Users can now manually correct the reconstruction: add, remove, or change a palette color, and repaint any pixel by picking a color from the palette. The palette always keeps a dedicated fully-transparent color first, letting pixels be erased even on images with no detected transparency. Every edit updates the reconstruction and the downloadable JSON immediately. The original and reconstruction previews now show a checkerboard behind transparent areas.

## [0.8.1] - 2026-09-27

### Fixed

- Fixed dark colors (near-black) not being recognized as a single color in the palette — an image's black outline could show up as many separate near-black colors instead of one.

## [0.8.0] - 2026-09-27

### Added

- Set up automatic deployment: every push to `main` builds and publishes the site to GitHub Pages, without ever overwriting a working deployment with a broken build. The site is now live.

## [0.7.0] - 2026-09-27

### Added

- The result now shows a confidence verdict — with a percentage and a short explanation — on whether the uploaded image actually looks like pixel art, based on how regular its detected pixel grid is and how small its color palette is.

## [0.6.0] - 2026-09-27

### Added

- Users can now download the generated pixel grid, palette, and per-pixel color data as a `.json` file, named after the source image. The download link only appears once a result has been generated, and disappears as soon as a new image is selected.

## [0.5.0] - 2026-09-27

### Added

- After uploading an image, users can now see it side by side with a reconstruction built purely from the detected pixel grid and color palette, plus the indexed color palette shown as labeled swatches. The comparison clears as soon as a new image is selected, so no stale result lingers.

## [0.4.0] - 2026-09-27

### Added

- Implemented serialization of a decomposed image into one JSON description: its logical grid size, its color palette as hex codes, and, for every logical pixel, the index of the palette color it uses. Not yet connected to the upload screen.

## [0.3.0] - 2026-09-24

### Added

- Implemented extraction and indexing of an image's color palette: the distinct colors used at the logical pixel grid level, with near-identical colors caused by compression artifacts folded into a single palette entry, plus the total distinct color count. Not yet connected to the upload screen.

## [0.2.0] - 2026-09-24

### Added

- Chose and documented the algorithms used to detect a pixel-art image's real pixel grid size and to extract its color palette, based on a research spike comparing candidate approaches against sample images.
- Implemented detection of an image's real pixel grid size (the logical pixel size and the resulting grid width/height), for upscaled pixel art as well as photos with no consistent grid. Not yet connected to the upload screen.

## [0.1.0] - 2026-09-24

### Added

- Users can now select an image file to upload and see an instant preview of it. Choosing a non-image file, or an unsupported format like SVG, shows a clear error message instead of a broken preview.

[Unreleased]: https://github.com/neolao/pixel-art-serializer/compare/v0.12.1...HEAD
[0.12.1]: https://github.com/neolao/pixel-art-serializer/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/neolao/pixel-art-serializer/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/neolao/pixel-art-serializer/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/neolao/pixel-art-serializer/releases/tag/v0.1.0
