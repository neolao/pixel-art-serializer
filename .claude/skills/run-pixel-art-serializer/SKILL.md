---
name: run-pixel-art-serializer
description: Build, run, and drive the pixel-art-serializer static web app. Use when asked to start the app, take a screenshot of it, or verify the image upload/preview feature works for real in a browser (not just tests).
---

pixel-art-serializer is a framework-free TypeScript/Vite static site (no
backend). It has no `chromium-cli` in this environment, so it's driven
by a small Playwright REPL at
`.claude/skills/run-pixel-art-serializer/driver.mjs`, using
`playwright-core` (a project devDependency) against headless Chromium.

All paths below are relative to the repo root.

## Prerequisites

`playwright-core` is already a devDependency (`npm install` installs it).
It needs a Chromium binary; if none is cached, install one once:

```bash
npx --yes playwright install chromium --with-deps
```

## Build

Nothing to build for local driving — Vite serves TypeScript directly in dev mode. For a production bundle:

```bash
npm install
npm run build   # outputs dist/
```

## Run (agent path)

1. Start the dev server in the background and wait for it to serve:

   ```bash
   npm run dev &
   timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
   ```

   Stop it later with `lsof -ti:5173 -sTCP:LISTEN | xargs -r kill` (npm doesn't forward signals to the Vite process it spawns).

2. Run the driver, wrapped in tmux so an agent can send commands and read output without relaunching Chromium each time:

   ```bash
   tmux new-session -d -s pa-driver -x 200 -y 50
   tmux send-keys -t pa-driver 'node .claude/skills/run-pixel-art-serializer/driver.mjs' Enter
   timeout 20 bash -c 'until tmux capture-pane -t pa-driver -p | grep -q "driver>"; do sleep 0.2; done'
   tmux send-keys -t pa-driver 'launch' Enter
   timeout 20 bash -c 'until tmux capture-pane -t pa-driver -p | grep -q "launched"; do sleep 0.2; done'
   tmux send-keys -t pa-driver 'nav' Enter
   tmux send-keys -t pa-driver 'ss landing' Enter
   tmux capture-pane -t pa-driver -p
   ```

   Screenshots land in `/tmp/pixel-art-serializer-shots/` (override with `SCREENSHOT_DIR`). Open the file to actually look at it — a blank page is a failure, not a success.

### Commands

| command | what it does |
|---|---|
| `launch` | launch headless Chromium |
| `nav [url]` | go to the app (default `http://localhost:5173`), waits for `#image-input` |
| `upload <selector> <fixture-or-path>` | set a file input's value; fixture names (`valid.png`, `notes.txt`, `corrupt.png`) resolve against `fixtures/` |
| `wait <css-sel>` | wait for an element, 10s timeout |
| `ss [name]` | screenshot → `/tmp/pixel-art-serializer-shots/<name>.png` |
| `eval <js>` | evaluate in the page, print JSON |
| `text [css-sel]` | print innerText |
| `scenarios` | **the capitalized check** — runs the upload feature's 3 verification scenarios (valid image, non-image file, corrupt image) end-to-end and prints the resulting DOM state as JSON |
| `quit` | close the browser, exit |

### The `scenarios` command

This is what backlog item 001 (image upload) was verified with, and the
main reason this skill exists: a corrupt file that has an image MIME
type but isn't actually decodable is a real case the app handles (shows
an error, not a broken image icon), but jsdom never fires image
`load`/`error` events, so it can't be covered by an automated test (see
`.vibe/decisions/001-corrupt-image-verified-at-runtime.md`). `scenarios`
re-runs that exact check in a real browser:

```bash
tmux send-keys -t pa-driver 'scenarios' Enter
timeout 20 bash -c 'until tmux capture-pane -t pa-driver -p | grep -q "corruptImage"; do sleep 0.5; done'
tmux capture-pane -t pa-driver -p -S -40
```

Expect all three to resolve correctly: `validImage` with a
`data:image/png;...` preview and no error, `nonImage` and `corruptImage`
both with an error shown and the preview hidden.

## Run (human path)

```bash
npm run dev   # opens on http://localhost:5173, Ctrl-C to stop
```

## Gotchas

- **No `chromium-cli` in this environment.** That's why there's a custom driver instead of the usual heredoc-to-`chromium-cli` pattern for web apps.
- **`npm run dev &` doesn't free the port on its own kill.** `$!` is the npm wrapper's PID, and npm doesn't forward `SIGTERM` to the Vite process it spawns — use `lsof -ti:5173 -sTCP:LISTEN | xargs -r kill` instead.
- **The decode-failure scenario needs a real wait, not just the `change` event.** The corrupt-image path only resolves once the browser's own `<img>` `onerror` fires asynchronously; `scenarios` waits 1.5s for it. A shorter wait can read stale state.
- **The native file input's visible label ("No file chosen") doesn't update** after `setInputFiles`/`upload` in headless mode — this is a rendering quirk, not a bug: `input.files` and the app's reaction to it are correct regardless, as `scenarios`'/`eval`'s DOM state confirms.

## Troubleshooting

- **`driver> ` never appears in the pane:** the dev server likely isn't up yet — re-run the `curl` wait loop from step 1 before launching the driver.
- **`launch` hangs or throws a missing-executable error:** no Chromium binary cached — run the Prerequisites install command.
- **`nav` times out waiting for `#image-input`:** the dev server crashed or is serving the wrong app — check its log and the port.
