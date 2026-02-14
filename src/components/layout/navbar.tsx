import { useId, useState } from 'react';
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
  Plus,
} from 'lucide-react';
import { useSettings } from '~/state/use-settings';
import { useNavbarLinks } from '~/state/use-navbar-links';
import { ShortcutsDialog } from '~/components/common/navbar-dialog';
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area';

export const Navbar = () => {
  const { links: shortcuts, refresh: refreshNavbarLinks } = useNavbarLinks();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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
    <header className="bg-background/80 border-b shadow w-full">
      <div className="flex items-center justify-between h-12 w-full px-2">
        <ScrollArea className="w-6/12">
          <div className="flex items-center gap-4 w-full justify-end">
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={
                shortcuts.length >= 5 ? 'Max links reached' : 'Manage shortcuts'
              }
              title={
                shortcuts.length >= 5 ? 'Maximum 5 links' : 'Manage shortcuts'
              }
              onClick={() => setShortcutsOpen(true)}
              disabled={shortcuts.length >= 5}
            >
              <Plus />
            </Button>

            <div className="flex items-center">
              {shortcuts.slice(0, 5).map((s) => (
                <Button
                  key={s.id}
                  asChild
                  variant="link"
                  size="xs"
                  className="text-muted-foreground"
                >
                  <a
                    href={s.url.startsWith('http') ? s.url : `https://${s.url}`}
                    rel="noopener noreferrer"
                    title={s.url}
                  >
                    {s.title}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          <ShortcutsDialog
            open={shortcutsOpen}
            onOpenChange={(open: boolean) => {
              setShortcutsOpen(open);
              if (!open) refreshNavbarLinks();
            }}
          />

          <ScrollBar orientation="horizontal" />
        </ScrollArea>

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
      </div>
    </header>
  );
};
