---
date: 2026-09-27
status: accepted
---
# A published JSON Schema, checked against real output by an automated test

**Context:** Besides plain-language docs for the exported JSON's shape, the Product Owner asked for a machine-checkable specification an external tool could validate a downloaded file against, without a person reading the docs first.

**Decision:** Publish a standalone JSON Schema file (`docs/pixel-art-serialization.schema.json`) describing the exact shape `serializePixelArt` produces, and add `ajv` as a devDependency purely to assert, in an automated test, that real serializer output actually validates against that schema.

**Reason:** A hand-written schema with nothing checking it against the real code is exactly the failure mode that left the previous invariants undocumented in the first place (visible only in code/ADRs, easy to silently drift from what the code actually does). `ajv` is the de facto standard JSON Schema validator for TypeScript/JavaScript, small, dependency-light, and only used in tests — it ships nothing to the production bundle.

**Rejected alternatives:** Publishing the schema with no automated check against real output (rejected: reintroduces the exact drift risk this decision exists to close). Generating the schema from the TypeScript types at build time (e.g. `ts-json-schema-generator`) instead of hand-writing it (rejected as disproportionate for one exported shape — adds a build-time code-generation step and its own devDependency for a file that changes rarely and is easy to keep in sync by hand once a test enforces conformance).
