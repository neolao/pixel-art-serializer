---
date: 2026-09-28
status: accepted
---
# GIF encoding built on the `omggif` library, not a hand-rolled LZW encoder

**Context:** Implementing GIF download alongside the existing JSON download. Unlike PNG, no browser canvas API can produce a GIF, so the file has to be assembled by hand: GIF requires LZW-compressed image data, a well-defined but easy-to-get-subtly-wrong bitstream algorithm (variable code width, dictionary resets, sub-block framing). Automated tests cannot render a GIF through a real `<img>` (same jsdom limitation as PNG, see `.vibe/decisions/003-canvas-pixel-extraction-verified-at-runtime.md`), so correctness has to be checked by decoding the produced bytes back into pixel indices in a test.

**Decision:** Use the small, dependency-free `omggif` library (`GifWriter` to encode, `GifReader` in tests to decode and verify round-trip) instead of writing a custom LZW encoder/decoder pair from scratch.

**Reason:** A hand-written LZW encoder is a classic source of subtle, hard-to-notice bugs (off-by-one in code width growth, dictionary reset timing, bit-packing order), and verifying it correctly would require *also* hand-writing an independent decoder — doubling the custom bitstream code for a project that otherwise reserves from-scratch algorithm work for the app's actual domain logic (grid detection, palette extraction), not for reimplementing a 1987 file format. `omggif` is tiny, has no dependencies of its own, and provides both directions, so the test suite decodes with a library the encoder never touches — a genuinely independent check, not a tautological one.

**Rejected alternatives:** A hand-rolled LZW encoder with a matching hand-rolled decoder for tests — rejected for the reasons above. A heavier general-purpose image library (e.g. one bundling PNG/JPEG/GIF encoding together) — rejected as disproportionate to a single, narrow need.
