# Release Guide

This project automates versioning, changelog, ZIP packaging, and GitHub Pages deploy via GitHub Actions.

## Prerequisites

- Enable GitHub Pages: Settings → Pages → Source: GitHub Actions
- Workflows:
  - `.github/workflows/changelog.yml` — Update changelog & tag
  - `.github/workflows/release.yml` — Build & upload ZIP to Release on tag
  - `.github/workflows/deploy.yml` — Deploy to Pages on `master`
- Tag format: `vX.Y.Z` (SemVer)

## Recommended flow (GitHub Actions)

1. Update changelog and create a tag
   - Actions → “Update Changelog” → Run workflow
   - Choose release type: `patch`, `minor`, or `major`
   - This bumps version, updates `CHANGELOG.md`, creates and pushes a tag
2. Build & upload ZIP
   - On tag push (`v*`), “Build & Release ZIP” runs
   - Produces `daily-tab-extension.zip` and attaches it to the GitHub Release
3. Deploy to GitHub Pages
   - On push to `master`, “Deploy to GitHub Pages” publishes `dist/`

## Local flow (step-by-step)

1. Pull latest from `master`

```bash
git pull origin master
```

2. Stage and commit your changes

```bash
git add -A
git commit -m "feat: your change summary"
```

3. Bump version and update changelog

```bash
# choose one
npm run release:patch   # bug fixes
npm run release:minor   # new features
npm run release:major   # breaking changes
```

4. Push branch and tags

```bash
git push origin master
git push --follow-tags origin master
# or push a specific tag
# git tag vX.Y.Z && git push origin vX.Y.Z
```

5. Watch Actions

- “Build & Release ZIP” attaches `daily-tab-extension.zip` to the new GitHub Release
- “Deploy to GitHub Pages” runs on `master` push and publishes `dist/`

## Actions UI (step-by-step)

1. Trigger changelog + tag

- GitHub → Actions → “Update Changelog” → Run workflow
- Select release type: `patch`, `minor`, or `major`

2. Release ZIP

- The tag triggers “Build & Release ZIP” and uploads `daily-tab-extension.zip`

3. Deploy Pages

- Push or merge to `master` to trigger “Deploy to GitHub Pages”

## Verify

- Releases: latest tag has `daily-tab-extension.zip` attached
- Pages: site URL shown in deploy job summary
- SPA fallback: `public/404.html` exists and redirects to `index.html`

## Store publishing (optional)

- Chrome Web Store
  - Upload `daily-tab-extension.zip`
  - Provide listing details and icons (128×128, 48×48, 16×16)
- Firefox Add-ons (AMO)
  - Ensure `browser_specific_settings.gecko.id` in `public/manifest.json`
  - Upload the ZIP to AMO and submit

## Notes

- Packaging uses `npm run package:ext` to build and zip `dist/` into `daily-tab-extension.zip`
- Vite `base: './'` ensures relative assets for Pages
