import { useId } from 'react';
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
import { useSettings } from '~/state/use-settings';

export const SettingsMenu = () => {
  const importId = useId();

  const {
    theme,
    density,
    fileInputRef,
    toggleTheme,
    toggleDensity,
    onExport,
    onImportClick,
    onImportFile,
    onReset,
  } = useSettings();

  return (
    <div className="flex items-center gap-1">
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
  );
};
