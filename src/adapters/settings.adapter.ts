/**
 * Settings Adapter
 * Handles persistence of settings, layout, shortcuts, etc. to storage
 * Abstracts away storage implementation details from state layer
 */

import type { Settings, LayoutState } from '~/types/settings';
import type { StoredShortcut } from '~/types/shortcuts';
import type { Todo } from '~/types/todos';
import { storageAdapter } from './storage.adapter';

const STORAGE_KEYS = {
  SETTINGS: 'dt_settings',
  SHORTCUTS: 'dt_shortcuts',
  NAVBAR_LINKS: 'dt_navbar_links',
  TODOS: 'dt_todos',
  LAYOUT: 'dt_layout',
} as const;

const DEFAULT_SETTINGS: Settings = {
  id: 'global',
  theme: 'light',
  density: 'compact',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export interface SettingsAdapter {
  loadSettings(): Settings;
  saveSettings(settings: Settings): void;
  loadShortcuts(): StoredShortcut[];
  saveShortcuts(shortcuts: StoredShortcut[]): void;
  loadNavbarLinks(): StoredShortcut[];
  saveNavbarLinks(links: StoredShortcut[]): void;
  loadLayout(): LayoutState;
  saveLayout(layout: LayoutState): void;
  loadTodos(): Todo[];
  saveTodos(todos: Todo[]): void;
  clearAll(): void;
}

export const createSettingsAdapter = (): SettingsAdapter => {
  return {
    loadSettings(): Settings {
      return storageAdapter.getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    },

    saveSettings(settings: Settings): void {
      storageAdapter.setItem(STORAGE_KEYS.SETTINGS, settings);
    },

    loadShortcuts(): StoredShortcut[] {
      return storageAdapter.getItem(STORAGE_KEYS.SHORTCUTS, []);
    },

    saveShortcuts(shortcuts: StoredShortcut[]): void {
      storageAdapter.setItem(STORAGE_KEYS.SHORTCUTS, shortcuts);
    },

    loadNavbarLinks(): StoredShortcut[] {
      return storageAdapter.getItem(STORAGE_KEYS.NAVBAR_LINKS, []);
    },

    saveNavbarLinks(links: StoredShortcut[]): void {
      storageAdapter.setItem(STORAGE_KEYS.NAVBAR_LINKS, links);
    },

    loadLayout(): LayoutState {
      return storageAdapter.getItem(STORAGE_KEYS.LAYOUT, {
        leftPanelWidth: 66,
        shortcutWidgetHeight: 65,
      });
    },

    saveLayout(layout: LayoutState): void {
      storageAdapter.setItem(STORAGE_KEYS.LAYOUT, layout);
    },

    loadTodos(): Todo[] {
      return storageAdapter.getItem(STORAGE_KEYS.TODOS, []);
    },

    saveTodos(todos: Todo[]): void {
      storageAdapter.setItem(STORAGE_KEYS.TODOS, todos);
    },

    clearAll(): void {
      storageAdapter.clear();
    },
  };
};

export const settingsAdapter = createSettingsAdapter();
