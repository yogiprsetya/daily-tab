import { ShortcutLinks } from './navbar-links';
import { SettingsMenu } from './settings-menu';

export const Navbar = () => {
  return (
    <header className="bg-background/80 border-b shadow w-full">
      <div className="flex items-center justify-between h-12 w-full px-2">
        <ShortcutLinks />
        <SettingsMenu />
      </div>
    </header>
  );
};
