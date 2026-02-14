// Minimal settings and data management aligned with PRD.
// IndexedDB is planned; this is a localStorage-backed placeholder for v0.1.
// Provides: theme + density persistence and JSON export/import/reset for all stores.

import type { Density, Settings, ThemeSetting } from '~/types/settings';
import type { StoredShortcut } from '~/types/shortcuts';

const SETTINGS_KEY = 'dt_settings';
const SHORTCUTS_KEY = 'dt_shortcuts';
const TODOS_KEY = 'dt_todos';
const NOTES_KEY = 'dt_notes';
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
    todos: JSON.parse(localStorage.getItem(TODOS_KEY) || '[]'),
    notes: JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'),
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
  if (Array.isArray(data.todos))
    localStorage.setItem(TODOS_KEY, JSON.stringify(data.todos));
  if (Array.isArray(data.notes))
    localStorage.setItem(NOTES_KEY, JSON.stringify(data.notes));
}

export function resetAll() {
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(SHORTCUTS_KEY);
  localStorage.removeItem(TODOS_KEY);
  localStorage.removeItem(NOTES_KEY);
}
