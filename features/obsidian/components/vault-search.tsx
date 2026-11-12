'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { FIELD } from '@/components/form-styles';
import { Input } from '@/components/ui/input';
import { obsidianHref } from '../href';

const PAUSE_MS = 300;

/**
 * Puts the query in the URL after a pause, as bookmarks does. A note's search is
 * not tied to a folder: searching from the vault root should find notes anywhere.
 */
export function VaultSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onChange(value: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      router.replace(obsidianHref({ q: value.trim() }), { scroll: false });
    }, PAUSE_MS);
  }

  return (
    <Input
      type="search"
      aria-label="Search notes"
      placeholder="Search notes"
      defaultValue={initialQuery}
      onChange={(event) => onChange(event.target.value)}
      autoComplete="off"
      className={FIELD}
    />
  );
}
