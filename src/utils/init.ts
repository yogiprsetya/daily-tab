import { settingsAdapter } from '~/adapters';
import type { StoredShortcut } from '~/types/shortcuts';
import type { Todo } from '~/types/todos';

/**
 * Initialize default data on first load only.
 * Does not overwrite existing user data.
 */
export function initDefaults() {
  try {
    const markerKey = 'dt_initialized';
    const initialized = localStorage.getItem(markerKey);
    if (initialized) return;

    const now = Date.now();

    // Navbar links
    const navbarLinks: StoredShortcut[] = [
      {
        id: 'gmail',
        title: 'Gmail',
        url: 'https://drive.google.com',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'drive',
        title: 'Drive',
        url: 'https://mail.google.com/mail',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'chatgpt',
        title: 'ChatGPT',
        url: 'https://chatgpt.com',
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Shortcuts
    const shortcuts: StoredShortcut[] = [
      {
        id: 'github',
        title: 'GIthub',
        url: 'https://github.com',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'daily-standup',
        title: 'Daily Standup',
        url: 'https://teams.microsoft.com',
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Todos
    const todos: Todo[] = [
      {
        id: 'todo-darkmode',
        title: 'Switch to darkmode',
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'todo-pending',
        title: 'Save watch later or reading list to Pending widget',
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'todo-note',
        title: 'Write a simple not to keep daily "thing"',
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Only seed if empty
    if (settingsAdapter.loadNavbarLinks().length === 0) {
      settingsAdapter.saveNavbarLinks(navbarLinks);
    }
    if (settingsAdapter.loadShortcuts().length === 0) {
      settingsAdapter.saveShortcuts(shortcuts);
    }
    if (settingsAdapter.loadTodos().length === 0) {
      settingsAdapter.saveTodos(todos);
    }

    localStorage.setItem(markerKey, '1');
  } catch (e) {
    // Non-fatal; app can run without defaults
    console.warn('Init defaults skipped:', e);
  }
}
