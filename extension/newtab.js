import { APP_URL } from './config.js';

const frame = document.getElementById('app');
const offline = document.getElementById('offline');

frame.src = `${APP_URL}/`;

// A cross-origin frame fires `load` even for an error page, so a parallel
// request tells a network failure apart. Any HTTP answer, even 503, counts as
// reachable: the app shows its own error page then.
fetch(`${APP_URL}/api/health`, { cache: 'no-store' }).catch(() => {
  frame.hidden = true;
  offline.hidden = false;
});

document.getElementById('retry').addEventListener('click', () => {
  location.reload();
});
