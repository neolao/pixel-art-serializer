---
status: todo
depends_on: [001, 002, 003, 004, 005, 006]
---
# Set Up GitHub Pages Deployment

## Description
The site is meant to be hosted on GitHub. Once the core upload-detect-serialize-display flow works, set up a CI workflow that builds the static site and deploys it to GitHub Pages.

## Acceptance Criteria
- [ ] Pushing to the main branch triggers a build and deploy to GitHub Pages
- [ ] The deployed site loads and the upload-to-result flow works end to end
- [ ] A failed build does not overwrite the currently deployed site

## Notes
Priority: SHOULD, to be done once the core features (items 001-006) are implemented.
