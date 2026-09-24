---
status: todo
depends_on: [004]
---
# Download Generated JSON Output

## Description
Once an image has been decomposed, the user must be able to retrieve the generated JSON description (grid, palette, per-pixel color indices) to use outside the site.

## Acceptance Criteria
- [ ] User can download the generated JSON as a `.json` file
- [ ] Downloaded file's content matches exactly what was computed for the currently displayed result
- [ ] The download control is disabled or hidden until a result has been generated

## Notes
Priority: MUST.
