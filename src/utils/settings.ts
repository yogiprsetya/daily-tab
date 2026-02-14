import type {
  Density,
  LayoutState,
  Settings,
  ThemeSetting,
} from '~/types/settings';
import type { StoredShortcut } from '~/types/shortcuts';

const STORAGE_KEYS = {
  SETTINGS: 'dt_settings',
  SHORTCUTS: 'dt_shortcuts',
  NAVBAR_LINKS: 'dt_navbar_links',
  TODOS: 'dt_todos',
  NOTES: 'dt_notes',
  LAYOUT: 'dt_layout',
} as const;

const SCHEMA_VERSION = 1;

// Generic storage load/save with JSON parsing
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const DEFAULT_LAYOUT_STATE = {
  leftPanelWidth: 66,
  shortcutWidgetHeight: 65,
};

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
  return loadFromStorage(STORAGE_KEYS.SETTINGS, defaultSettings());
}

export function saveSettings(partial: Partial<Settings>) {
  const current = loadSettings();
  const next: Settings = { ...current, ...partial, updatedAt: now() };
  saveToStorage(STORAGE_KEYS.SETTINGS, next);
}

export function loadShortcuts(): StoredShortcut[] {
  return loadFromStorage(STORAGE_KEYS.SHORTCUTS, []);
}

export function saveShortcuts(list: StoredShortcut[]) {
  saveToStorage(STORAGE_KEYS.SHORTCUTS, list);
}

export function loadNavbarLinks(): StoredShortcut[] {
  return loadFromStorage(STORAGE_KEYS.NAVBAR_LINKS, []);
}

export function saveNavbarLinks(list: StoredShortcut[]) {
  saveToStorage(STORAGE_KEYS.NAVBAR_LINKS, list);
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
    settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || 'null'),
    shortcuts: JSON.parse(localStorage.getItem(STORAGE_KEYS.SHORTCUTS) || '[]'),
    navbarLinks: JSON.parse(
      localStorage.getItem(STORAGE_KEYS.NAVBAR_LINKS) || '[]'
    ),
    todos: JSON.parse(localStorage.getItem(STORAGE_KEYS.TODOS) || '[]'),
    notes: JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]'),
    layout: JSON.parse(localStorage.getItem(STORAGE_KEYS.LAYOUT) || 'null'),
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
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
  if (Array.isArray(data.shortcuts))
    localStorage.setItem(
      STORAGE_KEYS.SHORTCUTS,
      JSON.stringify(data.shortcuts)
    );
  if (Array.isArray(data.navbarLinks))
    localStorage.setItem(
      STORAGE_KEYS.NAVBAR_LINKS,
      JSON.stringify(data.navbarLinks)
    );
  if (Array.isArray(data.todos))
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(data.todos));
  if (Array.isArray(data.notes))
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data.notes));
  if (data.layout && typeof data.layout === 'object')
    localStorage.setItem(STORAGE_KEYS.LAYOUT, JSON.stringify(data.layout));
}

export function resetAll() {
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.SHORTCUTS);
  localStorage.removeItem(STORAGE_KEYS.NAVBAR_LINKS);
  localStorage.removeItem(STORAGE_KEYS.TODOS);
  localStorage.removeItem(STORAGE_KEYS.NOTES);
  localStorage.removeItem(STORAGE_KEYS.LAYOUT);
}

export function loadLayout(): LayoutState {
  const parsed = loadFromStorage(STORAGE_KEYS.LAYOUT, DEFAULT_LAYOUT_STATE);

  if (
    typeof parsed.leftPanelWidth !== 'number' ||
    typeof parsed.shortcutWidgetHeight !== 'number'
  )
    return DEFAULT_LAYOUT_STATE;

  return parsed;
}

export function saveLayout(next: Partial<LayoutState>) {
  const current = loadLayout();
  const merged = { ...current, ...next };
  saveToStorage(STORAGE_KEYS.LAYOUT, merged);
}
