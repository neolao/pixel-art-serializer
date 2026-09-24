---
date: 2026-09-24
status: accepted
---
# Corrupt image decode failures verified at runtime, not by automated tests

**Context:** Implementing the image upload feature (backlog item 001), a corrupt file that passes the image MIME-type check but fails to actually decode must show an error instead of a broken preview.

**Decision:** The MIME-type validation (reject non-images and SVG) is covered by automated jsdom tests. The actual image-decode failure path is implemented with a real `onerror` handler on the `<img>` element, but is verified through the `run` skill in a real browser rather than an automated test.

**Reason:** A spike confirmed jsdom's `HTMLImageElement` never fires `load` or `error` for a `data:` URL — the event handlers never resolve, so a jsdom test for this path would hang or require mocking away the exact browser behaviour being tested, making the test meaningless.

**Rejected alternatives:** Mocking `Image`/`FileReader` to simulate a fake decode failure — rejected because it would only prove the mock works, not the real decode-error handling; skipping decode-error handling entirely — rejected because it directly contradicts the "no broken preview" acceptance criterion.
