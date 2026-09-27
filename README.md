# pixel-art-serializer

A static website that takes an image and turns it into a JSON description of its pixels, to help detect whether the image is pixel art.

**Live site:** https://neolao.github.io/pixel-art-serializer/

<!-- vibe:begin:features -->
- Select an image file and see an instant preview of it on the page.
- Choosing a file that isn't a supported image (including SVG, which isn't pixel data) shows a clear error message instead of a broken preview.
- See the uploaded image side by side with a reconstruction built purely from its detected pixel grid and color palette, plus the color palette itself shown as labeled swatches.
- See the reconstruction's detected grid size (width × height, in logical pixels) shown right next to it.
- Pixel grid detection now works reliably on real-world pixel art with soft or anti-aliased edges, such as a photographed or re-compressed sprite, where it previously failed to find any grid at all.
- Selecting a new image immediately clears the previous comparison, so no stale result is ever shown alongside a new upload.
- Download the detected pixel grid, palette, and per-pixel color data as a `.json` file, named after the source image, once a result is ready.
- See a confidence verdict on whether the uploaded image actually looks like pixel art, with a short explanation of what drove the score.
- Manually correct the reconstruction: add, remove, or change a palette color, and repaint any pixel by picking a color from the palette. A dedicated fully-transparent color is always available, even on images with no detected transparency, so pixels can be erased. Every edit updates the reconstruction and the downloadable JSON immediately.
- See transparent areas of the original and reconstructed image clearly, over a checkerboard backdrop.
- Manually merge two or more palette colors into one you choose, for cases where the automatic grouping isn't quite what you want. Every affected pixel switches to the merged color, reflected everywhere: the palette, the reconstruction, and the downloadable JSON.
- The downloaded JSON is self-describing: it carries a version number and a clear marker on its permanent transparent color, and comes with a written explanation of its shape plus a published schema so other programs can validate it automatically.
<!-- vibe:end:features -->

<!-- vibe:begin:install -->
**Prerequisites:** Node.js and npm.

```bash
npm install
```

Verify the install worked:

```bash
npm run dev
```

This starts a local development server; open the printed URL in your browser.
<!-- vibe:end:install -->

<!-- vibe:begin:usage -->
Start the app locally:

```bash
npm run dev
```

Build the static site for deployment:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```
<!-- vibe:end:usage -->

<!-- vibe:begin:docs-index -->
- [docs/architecture.md](docs/architecture.md) — how the upload/preview flow is structured, module by module.
- [docs/deployment.md](docs/deployment.md) — how the site is built and published to GitHub Pages.
- [docs/json-format.md](docs/json-format.md) — the shape of the downloaded JSON file, field by field, plus a machine-checkable schema.
- [docs/testing.md](docs/testing.md) — what the test suite covers, and what's verified manually instead.
<!-- vibe:end:docs-index -->
