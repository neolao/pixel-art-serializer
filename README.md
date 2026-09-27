# pixel-art-serializer

A static website that takes an image and turns it into a JSON description of its pixels, to help detect whether the image is pixel art.

<!-- vibe:begin:features -->
- Select an image file and see an instant preview of it on the page.
- Choosing a file that isn't a supported image (including SVG, which isn't pixel data) shows a clear error message instead of a broken preview.
- See the uploaded image side by side with a reconstruction built purely from its detected pixel grid and color palette, plus the color palette itself shown as labeled swatches.
- Selecting a new image immediately clears the previous comparison, so no stale result is ever shown alongside a new upload.
- Download the detected pixel grid, palette, and per-pixel color data as a `.json` file, named after the source image, once a result is ready.
- See a confidence verdict on whether the uploaded image actually looks like pixel art, with a short explanation of what drove the score.
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
- [docs/testing.md](docs/testing.md) — what the test suite covers, and what's verified manually instead.
<!-- vibe:end:docs-index -->
