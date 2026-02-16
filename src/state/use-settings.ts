/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import type { Density, ThemeSetting, Settings } from '~/types/settings';
import {
  domAdapter,
  settingsAdapter,
  notesAdapter,
  pendingAdapter,
} from '~/adapters';
import { showConfirm } from '~/components/ui/alert-provider';

function reloadAndApplySettings() {
  // Get settings from adapter
  const rawSettings = settingsAdapter.loadSettings();
  // For now, use defaults if not present
  const s = {
    theme: (rawSettings?.theme || 'system') as ThemeSetting,
    density: (rawSettings?.density || 'compact') as Density,
  };
  domAdapter.applyTheme(s.theme);
  domAdapter.applyDensity(s.density);
  return s;
}

export function useSettings() {
  const [theme, setTheme] = useState<ThemeSetting>(() => {
    const settings = settingsAdapter.loadSettings();
    return (settings?.theme || 'system') as ThemeSetting;
  });
  const [density, setDensity] = useState<Density>(() => {
    const settings = settingsAdapter.loadSettings();
    return (settings?.density || 'compact') as Density;
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    domAdapter.applyTheme(theme);
    domAdapter.applyDensity(density);
    const now = Date.now();
    const settings = settingsAdapter.loadSettings();
    const updated: Settings = {
      ...settings,
      theme,
      density,
      updatedAt: now,
    };
    settingsAdapter.saveSettings(updated);
  }, [theme, density]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const toggleDensity = () => {
    setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'));
  };

  const onExport = () => {
    const payload = {
      schemaVersion: 1,
      settings: settingsAdapter.loadSettings(),
      shortcuts: settingsAdapter.loadShortcuts(),
      navbarLinks: settingsAdapter.loadNavbarLinks(),
      todos: settingsAdapter.loadTodos(),
      notes: notesAdapter.load(),
      pending: pendingAdapter.load(),
      layout: settingsAdapter.loadLayout(),
    };
    domAdapter.exportJSON(payload);
  };
  const onImportClick = () => fileInputRef.current?.click();

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = domAdapter.importJSON(text);

      if (typeof data !== 'object' || data == null)
        throw new Error('Invalid file');
      if (!('schemaVersion' in data)) throw new Error('Missing schemaVersion');

      // Validate size (notes and pending)
      const notesText = JSON.stringify((data as any).notes || []);
      const pendingText = JSON.stringify((data as any).pending || []);
      if (notesText.length > 2_000_000 || pendingText.length > 2_000_000) {
        throw new Error('Import too large');
      }

      // Restore data through adapters
      if (data.settings)
        settingsAdapter.saveSettings(data.settings as Settings);
      if (Array.isArray(data.shortcuts))
        settingsAdapter.saveShortcuts(data.shortcuts);
      if (Array.isArray(data.navbarLinks))
        settingsAdapter.saveNavbarLinks(data.navbarLinks);
      if (Array.isArray(data.todos)) settingsAdapter.saveTodos(data.todos);
      if (Array.isArray((data as any).notes))
        notesAdapter.save((data as any).notes);
      if (Array.isArray((data as any).pending))
        pendingAdapter.save((data as any).pending);
      if (data.layout) settingsAdapter.saveLayout(data.layout);

      const s = reloadAndApplySettings();
      setTheme(s.theme);
      setDensity(s.density);
    } catch (err) {
      console.error('Import failed', err);
    } finally {
      e.target.value = '';
    }
  };

  const onReset = async () => {
    const ok = await showConfirm('Reset all data? This cannot be undone.');
    if (ok) {
      settingsAdapter.clearAll();
      const s = reloadAndApplySettings();
      setTheme(s.theme);
      setDensity(s.density);
    }
  };

  return {
    theme,
    density,
    fileInputRef,
    toggleTheme,
    toggleDensity,
    onExport,
    onImportClick,
    onImportFile,
    onReset,
  } as const;
}
