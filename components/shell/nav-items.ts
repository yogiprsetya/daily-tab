import {
  BookOpen,
  Bookmark,
  House,
  ListTodo,
  NotebookText,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Single source for both the desktop rail and the mobile tab bar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Home', icon: House },
  { href: '/todos', label: 'Todos', icon: ListTodo },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/reading-list', label: 'Reading', icon: BookOpen },
  { href: '/obsidian', label: 'Obsidian', icon: NotebookText },
];

export function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
