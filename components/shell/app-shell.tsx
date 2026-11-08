import { BottomTabBar } from './bottom-tab-bar';
import { NavRail } from './nav-rail';

/**
 * Full-viewport frame: navigation never scrolls away, only <main> scrolls.
 * ≥1024px: left rail. <1024px: bottom tab bar.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full flex-col lg:flex-row">
      <NavRail className="hidden lg:flex" />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>
      <BottomTabBar className="lg:hidden" />
    </div>
  );
}
