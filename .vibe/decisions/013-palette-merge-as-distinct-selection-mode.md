---
date: 2026-09-27
status: accepted
---
# Manual palette merge as a distinct selection mode, with paint color following the merge survivor

**Context:** Implementing manual palette color merging (backlog item 010): the user selects two or more palette colors and merges them into one, chosen from the selection.

**Decision:** Merging uses a dedicated toggleable "merge mode" where swatches show checkboxes instead of their normal recolor/remove controls, rather than overloading the existing single-click swatch interactions. Merging happens immediately once a survivor is picked, with no confirmation step, matching the existing color-removal behavior. If the color currently active for canvas painting is merged away, the active paint color automatically switches to the merge survivor instead of being cleared.

**Reason:** A single swatch already carries three distinct interactions (paint-select, recolor, remove); adding a fourth (multi-select for merge) on the same click target would be ambiguous. A dedicated mode keeps each interaction unambiguous. Immediate merge without confirmation was chosen for consistency with how removal already behaves. Following the paint color onto the survivor avoids leaving the user's in-progress paint action silently referencing a color that no longer exists.

**Rejected alternatives:** Overloading the existing swatch click with a modifier key (e.g. shift-click) to build the merge selection — rejected as non-obvious and untestable via plain clicks. Clearing the active paint color when it gets merged away (mirroring removal's behavior) — rejected per Product Owner decision in favor of continuity of the paint action.
