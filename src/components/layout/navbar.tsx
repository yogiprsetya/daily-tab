import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '~/components/ui/dropdown-menu';
import {
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  StretchVertical,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  applyDensity,
  applyTheme,
  exportAll,
  importAll,
  loadSettings,
  resetAll,
  saveSettings,
} from '~/utils/settings';
import type { Density, ThemeSetting } from '~/types/settings';

export const Navbar = () => {
  // Lazy init from stored settings
  const [theme, setTheme] = useState<ThemeSetting>(() => loadSettings().theme);
  const [density, setDensity] = useState<Density>(() => loadSettings().density);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importId = useId();

  // Apply and persist when settings change
  useEffect(() => {
    applyTheme(theme);
    applyDensity(density);
    saveSettings({ theme, density });
  }, [theme, density]);

  const toggleTheme = () => {
    const next: ThemeSetting = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const toggleDensity = () => {
    const next: Density = density === 'compact' ? 'comfortable' : 'compact';
    setDensity(next);
  };

  const onExport = () => {
    exportAll();
  };

  const onImportClick = () => fileInputRef.current?.click();

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importAll(text);
      // re-apply settings after import
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

  return (
    <header className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70 border rounded-3xl shadow">
      <div className="flex h-12 w-52 items-center justify-end gap-1 px-2">
        {/* Hidden file input for Import */}
        <input
          id={importId}
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={onImportFile}
        />

        {/* Settings dropdown (shadcn) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Open settings"
              title="Settings"
            >
              <SettingsIcon aria-hidden />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent sideOffset={6} align="end" className="w-56">
            <DropdownMenuCheckboxItem
              checked={theme === 'dark'}
              onCheckedChange={() => {
                toggleTheme();
              }}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Moon aria-hidden /> : <Sun aria-hidden />}
              <span>Dark mode</span>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={density === 'comfortable'}
              onCheckedChange={() => {
                toggleDensity();
              }}
              aria-label="Toggle comfortable density"
            >
              <StretchVertical aria-hidden />
              <span>Comfortable density</span>
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={onExport}>
              <Download aria-hidden />
              <span>Export</span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={onImportClick}>
              <Upload aria-hidden />
              <span>Import</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onSelect={onReset}
              aria-label="Reset all data"
            >
              <RotateCcw aria-hidden />
              <span>Reset data</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
