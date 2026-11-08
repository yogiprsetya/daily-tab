'use client';

import { type ReactNode, useEffect, useRef } from 'react';

/**
 * A joined button group cannot wrap, so a long list scrolls sideways. This
 * keeps the active filter on screen when the page opens or the filter changes.
 */
export function ProjectFilterNav({
  activeKey,
  children,
}: {
  activeKey: string;
  children: ReactNode;
}) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector('[aria-current="page"]');
    if (!nav || !active) return;

    // Not scrollIntoView: that can also scroll the page itself.
    const navBox = nav.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    const centered = (navBox.width - activeBox.width) / 2;
    nav.scrollTo({
      left: nav.scrollLeft + activeBox.left - navBox.left - centered,
    });
  }, [activeKey]);

  return (
    <nav
      ref={navRef}
      aria-label="Filter by project"
      className="min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto p-px"
    >
      {children}
    </nav>
  );
}
