# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

[Unreleased]: https://github.com/neolao/pixel-art-serializer/compare/v0.8.1...HEAD
[0.8.1]: https://github.com/neolao/pixel-art-serializer/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/neolao/pixel-art-serializer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/neolao/pixel-art-serializer/releases/tag/v0.1.0
