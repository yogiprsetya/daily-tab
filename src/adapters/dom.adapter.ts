/**
 * DOM Adapter
 * Handles DOM manipulation (theme, density, etc.)
 * Abstracts away DOM implementation details from state layer
 */

import type { Density, ThemeSetting } from '~/types/settings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export interface DOMAdapter {
  applyTheme(theme: ThemeSetting): void;
  applyDensity(density: Density): void;
  exportJSON(data: AnyRecord): void;
  importJSON(json: string): AnyRecord;
}

export const createDOMAdapter = (): DOMAdapter => {
  return {
    applyTheme(theme: ThemeSetting): void {
      const root = document.documentElement;
      const isDark =
        theme === 'dark' ||
        (theme === 'system' &&
          typeof matchMedia !== 'undefined' &&
          matchMedia('(prefers-color-scheme: dark)').matches);

      root.classList.toggle('dark', isDark);
    },

    applyDensity(density: Density): void {
      const root = document.documentElement;
      const densityClass = `density-${density}`;

      // Remove other density classes
      root.classList.remove('density-compact', 'density-comfortable');
      root.classList.add(densityClass);
    },

    exportJSON(data: AnyRecord): void {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-tab-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    importJSON(json: string): AnyRecord {
      return JSON.parse(json);
    },
  };
};

export const domAdapter = createDOMAdapter();
