---
date: 2026-09-24
status: accepted
---
# Canvas pixel extraction verified at runtime, not by automated tests

**Context:** Implementing pixel grid size detection (backlog item 002), the app needs to read an uploaded image's raw pixel data via a canvas (`drawImage` + `getImageData`) at its natural resolution, before handing that data to the (pure, unit-tested) detection algorithm.

**Decision:** The detection algorithm itself is a pure function, fully covered by automated tests using synthetic pixel data. The canvas extraction step is implemented against the real `HTMLCanvasElement`/`CanvasRenderingContext2D` APIs and is verified through the `run` skill in a real browser rather than an automated test.

**Reason:** jsdom (the project's test environment) does not implement a real 2D canvas — `getContext("2d")` returns `null` without the optional `canvas` native package, which this project does not depend on. This is the same category of gap already recorded in decision `001-corrupt-image-verified-at-runtime`: a jsdom test for this path would either fail to run at all or require mocking away the exact browser behaviour being verified.

**Rejected alternatives:** Adding the `canvas` npm package to get a real 2D context inside jsdom — rejected to avoid a native-binding devDependency for a single test path, and it still wouldn't prove the code works against a real browser's canvas implementation; mocking `CanvasRenderingContext2D` — rejected for the same reason as the analogous decision in item 001: it would only prove the mock works.
