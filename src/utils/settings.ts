import type {
  Density,
  LayoutState,
  Settings,
  ThemeSetting,
} from '~/types/settings';
import type { StoredShortcut } from '~/types/shortcuts';

const SETTINGS_KEY = 'dt_settings';
const SHORTCUTS_KEY = 'dt_shortcuts';
const NAVBAR_LINKS_KEY = 'dt_navbar_links';
const TODOS_KEY = 'dt_todos';
const NOTES_KEY = 'dt_notes';
const LAYOUT_KEY = 'dt_layout';
const SCHEMA_VERSION = 1;

function now() {
  return Date.now();
}

function defaultSettings(): Settings {
  const prefersDark =
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-color-scheme: dark)').matches;

  return {
    id: 'global',
    theme: prefersDark ? 'dark' : 'light',
    density: 'compact',
    createdAt: now(),
    updatedAt: now(),
  };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Settings;
    return parsed;
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(partial: Partial<Settings>) {
  const current = loadSettings();
  const next: Settings = { ...current, ...partial, updatedAt: now() };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

export function loadShortcuts(): StoredShortcut[] {
  try {
    const raw = localStorage.getItem(SHORTCUTS_KEY) || '[]';
    const parsed = JSON.parse(raw) as StoredShortcut[];
    return parsed;
  } catch {
    return [];
  }
}

export function saveShortcuts(list: StoredShortcut[]) {
  try {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function loadNavbarLinks(): StoredShortcut[] {
  try {
    const raw = localStorage.getItem(NAVBAR_LINKS_KEY) || '[]';
    const parsed = JSON.parse(raw) as StoredShortcut[];
    return parsed;
  } catch {
    return [];
  }
}

export function saveNavbarLinks(list: StoredShortcut[]) {
  try {
    localStorage.setItem(NAVBAR_LINKS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function applyTheme(theme: ThemeSetting) {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-color-scheme: dark)').matches);

  root.classList.toggle('dark', isDark);
}

export function applyDensity(density: Density) {
  const root = document.documentElement;
  root.dataset['density'] = density;
}

export function exportAll() {
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    settings: JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'),
    shortcuts: JSON.parse(localStorage.getItem(SHORTCUTS_KEY) || '[]'),
    navbarLinks: JSON.parse(localStorage.getItem(NAVBAR_LINKS_KEY) || '[]'),
    todos: JSON.parse(localStorage.getItem(TODOS_KEY) || '[]'),
    notes: JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'),
    layout: JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null'),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'daily-tab-export.json';
  a.click();

  URL.revokeObjectURL(url);
}

export async function importAll(jsonText: string) {
  const data = JSON.parse(jsonText);

  if (typeof data !== 'object' || data == null) throw new Error('Invalid file');
  if (!('schemaVersion' in data)) throw new Error('Missing schemaVersion');
  // Basic size safeguard for notes
  const notesText = JSON.stringify(data.notes || []);

  if (notesText.length > 2_000_000) throw new Error('Import too large');

  if (data.settings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
  if (Array.isArray(data.shortcuts))
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(data.shortcuts));
  if (Array.isArray(data.navbarLinks))
    localStorage.setItem(NAVBAR_LINKS_KEY, JSON.stringify(data.navbarLinks));
  if (Array.isArray(data.todos))
    localStorage.setItem(TODOS_KEY, JSON.stringify(data.todos));
  if (Array.isArray(data.notes))
    localStorage.setItem(NOTES_KEY, JSON.stringify(data.notes));
  if (data.layout && typeof data.layout === 'object')
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(data.layout));
}

export function resetAll() {
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(SHORTCUTS_KEY);
  localStorage.removeItem(NAVBAR_LINKS_KEY);
  localStorage.removeItem(TODOS_KEY);
  localStorage.removeItem(NOTES_KEY);
  localStorage.removeItem(LAYOUT_KEY);
}

export function loadLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);

    if (!raw) return { leftPanelWidth: 66, topWidgetHeight: 65 };

    const parsed = JSON.parse(raw) as LayoutState;

    if (
      typeof parsed.leftPanelWidth !== 'number' ||
      typeof parsed.topWidgetHeight !== 'number'
    )
      return { leftPanelWidth: 66, topWidgetHeight: 65 };

    return parsed;
  } catch {
    return { leftPanelWidth: 66, topWidgetHeight: 65 };
  }
}

export function saveLayout(next: Partial<LayoutState>) {
  try {
    const current = loadLayout();
    const merged = { ...current, ...next };
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}
