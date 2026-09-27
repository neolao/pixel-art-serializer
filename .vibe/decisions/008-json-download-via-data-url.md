---
date: 2026-09-27
status: accepted
---
# JSON download built as a data: URL, not a Blob object URL

**Context:** Implementing the JSON download control (backlog item 006), the app needs to offer the currently displayed result as a downloadable `.json` file.

**Decision:** Set the download link's `href` directly to a `data:application/json` URL containing the percent-encoded JSON, with a `download` attribute for the filename, rather than building a `Blob` and an object URL via `URL.createObjectURL`.

**Reason:** A `data:` URL needs no runtime browser API beyond string encoding, so the whole control (including its exact JSON content) is covered by automated tests; `URL.createObjectURL`/`Blob` are not implemented in jsdom, which would have pushed this entire feature into the project's real-browser-only verification path for no real benefit at this data size (a per-image JSON description, not a large file).

**Rejected alternatives:** `Blob` + `URL.createObjectURL` — the conventional approach for larger downloads, but untestable in this project's test environment and unnecessary here since the JSON payload stays small enough that a `data:` URL carries no practical downside.
