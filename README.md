# pixel-art-serializer

A static website that takes an image and turns it into a JSON description of its pixels, to help detect whether the image is pixel art.

<!-- vibe:begin:features -->
- Select an image file and see an instant preview of it on the page.
- Choosing a file that isn't a supported image (including SVG, which isn't pixel data) shows a clear error message instead of a broken preview.
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
