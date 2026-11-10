import { APP_URL } from './config.js';
import { badgeFor, saveRequest } from './save.js';

const DEFAULT_TITLE = chrome.runtime.getManifest().action.default_title;

chrome.action.onClicked.addListener(async (tab) => {
  const body = saveRequest(tab);
  // A page that is not http or https is refused here, without a request.
  const status = body ? await post(body) : 400;
  show(tab.id, badgeFor(status));
});

// Tab-specific badges outlive navigation, so clear them when a page loads.
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status !== 'loading') return;
  chrome.action.setBadgeText({ tabId, text: '' });
  chrome.action.setTitle({ tabId, title: DEFAULT_TITLE });
});

async function post(body) {
  try {
    const res = await fetch(`${APP_URL}/api/reading-items`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.status;
  } catch {
    return 0;
  }
}

function show(tabId, badge) {
  chrome.action.setBadgeText({ tabId, text: badge.text });
  chrome.action.setBadgeBackgroundColor({
    tabId,
    color: badge.ok ? '#15803d' : '#b91c1c',
  });
  chrome.action.setTitle({ tabId, title: badge.tooltip });
}
