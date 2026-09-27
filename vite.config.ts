import { defineConfig } from "vite";

// Only the GitHub Pages deploy workflow sets GITHUB_PAGES, so local dev,
// local builds/previews, and the run-pixel-art-serializer skill (which
// hardcodes http://localhost:5173) are unaffected — see
// .vibe/decisions/010-conditional-vite-base-for-pages.md.
export default defineConfig({
	base: process.env.GITHUB_PAGES ? "/pixel-art-serializer/" : "/",
});
