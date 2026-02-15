# Daily Tab – Browser Extension (MV3)

Turn your New Tab into a sleek daily dashboard: todos, notes, shortcuts, and focus tools at a glance.

## Features

- Todos and pending items
- Notes and shortcuts
- Resizable layout and keyboard shortcuts
- Minimal, fast, offline-ready UI

## Tech Stack

- React 19, Vite 7, TypeScript
- TailwindCSS 4, Radix UI

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build (web)

```bash
npm run build
npm run preview
```

## Browser Extension (MV3)

This project ships as a New Tab override extension for Chromium and Firefox.

### Manifest

- `public/manifest.json` uses:
  ```json
  {
    "manifest_version": 3,
    "chrome_url_overrides": { "newtab": "index.html" }
  }
  ```
- `vite.config.ts` sets `base: "./"` for relative asset paths.
- `index.html` uses a relative favicon path.

### Build for Extension

```bash
npm run package:ext
```

This builds to `dist/` and zips it as `daily-tab-extension.zip`.

### Load Unpacked (Chrome/Edge)

1. Chrome → Extensions → enable Developer mode
2. Click “Load unpacked” and select the `dist` folder
3. Open a New Tab to see Daily Tab

### Temporary Install (Firefox)

1. Firefox → about:debugging → This Firefox
2. Click “Load Temporary Add-on…” and select `dist/manifest.json`
3. Open a New Tab to see Daily Tab

### Publish to Stores

Chrome Web Store:

1. Create a Developer account at the Chrome Web Store Dashboard
2. Upload `daily-tab-extension.zip`
3. Provide description, screenshots, and 128×128, 48×48, 16×16 icons
4. Submit for review

Firefox Add-ons (AMO):

1. Ensure `browser_specific_settings.gecko.id` is set in `manifest.json`
2. Upload the ZIP to https://addons.mozilla.org/developers/
3. Fill listing details and submit

### Permissions & Policies

- New Tab override requires no extra permissions
- If adding network calls, declare `host_permissions`
- For cross-device sync, migrate from `localStorage` to `chrome.storage.sync`

### Optional: open once after install

Add a background service worker:

```json
// public/manifest.json
{
  "background": { "service_worker": "background.js" }
}
```

```js
// public/background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
```

## Deploy to GitHub Pages (free)

- Run: `npm run deploy:pages`
- The site will be published to the repository’s GitHub Pages

Tip: Users can install a “New Tab Redirect” extension and set it to your Pages URL as a free alternative to store publishing.

## Useful Links

- Chrome Extensions: https://developer.chrome.com/docs/extensions
- Firefox WebExtensions: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
