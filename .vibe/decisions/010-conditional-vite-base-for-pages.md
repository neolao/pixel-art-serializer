---
date: 2026-09-27
status: accepted
---
# Vite base path set conditionally, only for the GitHub Pages build

**Context:** Implementing GitHub Pages deployment (backlog item 008), the site is served as a project page at `https://neolao.github.io/pixel-art-serializer/` — a non-root subpath — which requires Vite's `base` to be set accordingly so bundled asset URLs resolve correctly once deployed.

**Decision:** Set `base` in `vite.config.ts` to `/pixel-art-serializer/` only when a dedicated `GITHUB_PAGES` environment variable is set (set by the deploy workflow's build step), defaulting to `/` otherwise.

**Reason:** Setting `base` unconditionally would also change local `npm run dev`/`npm run build`/`npm run preview` to expect that same subpath, breaking the existing `run-pixel-art-serializer` skill (which hardcodes `http://localhost:5173`) and every contributor's local workflow, for no benefit outside the actual deployed environment.

**Rejected alternatives:** An unconditional `base: "/pixel-art-serializer/"` — rejected for the local-workflow breakage above; deriving the base from Vite's `command`/`mode` — rejected as more implicit and easier to get wrong than a single, explicitly-named environment variable set only by the workflow that needs it.
