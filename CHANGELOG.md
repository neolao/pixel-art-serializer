# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Chose and documented the algorithms used to detect a pixel-art image's real pixel grid size and to extract its color palette, based on a research spike comparing candidate approaches against sample images.
- Implemented detection of an image's real pixel grid size (the logical pixel size and the resulting grid width/height), for upscaled pixel art as well as photos with no consistent grid. Not yet connected to the upload screen.

## [0.1.0] - 2026-09-24

### Added

- Users can now select an image file to upload and see an instant preview of it. Choosing a non-image file, or an unsupported format like SVG, shows a clear error message instead of a broken preview.

[Unreleased]: https://github.com/neolao/pixel-art-serializer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/neolao/pixel-art-serializer/releases/tag/v0.1.0
