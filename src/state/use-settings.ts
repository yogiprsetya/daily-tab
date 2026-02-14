import { useEffect, useRef, useState } from 'react';
import type { Density, ThemeSetting } from '~/types/settings';
import {
  applyDensity,
  applyTheme,
  exportAll,
  importAll,
  loadSettings,
  resetAll,
  saveSettings,
} from '~/utils/settings';

export function useSettings() {
  const [theme, setTheme] = useState<ThemeSetting>(() => loadSettings().theme);
  const [density, setDensity] = useState<Density>(() => loadSettings().density);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    applyTheme(theme);
    applyDensity(density);
    saveSettings({ theme, density });
  }, [theme, density]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const toggleDensity = () => {
    setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'));
  };

  const onExport = () => exportAll();
  const onImportClick = () => fileInputRef.current?.click();

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importAll(text);
      const s = loadSettings();
      setTheme(s.theme);
      setDensity(s.density);
      applyTheme(s.theme);
      applyDensity(s.density);
    } catch (err) {
      console.error('Import failed', err);
    } finally {
      e.target.value = '';
    }
  };

  const onReset = () => {
    if (confirm('Reset all data? This cannot be undone.')) {
      resetAll();
      const s = loadSettings();
      setTheme(s.theme);
      setDensity(s.density);
      applyTheme(s.theme);
      applyDensity(s.density);
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
