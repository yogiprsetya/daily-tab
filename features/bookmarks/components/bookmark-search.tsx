'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { FIELD } from '@/components/form-styles';
import { Input } from '@/components/ui/input';

const PAUSE_MS = 300;

export function BookmarkSearch({
  initialQuery,
  folderParam,
}: {
  initialQuery: string;
  folderParam: string | null;
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onChange(value: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (folderParam) params.set('folder', folderParam);
      if (value.trim()) params.set('q', value.trim());
      const query = params.toString();
      router.replace(query ? `/bookmarks?${query}` : '/bookmarks', {
        scroll: false,
      });
    }, PAUSE_MS);
  }

  return (
    <Input
      type="search"
      aria-label="Search bookmarks"
      placeholder="Search bookmarks"
      defaultValue={initialQuery}
      onChange={(event) => onChange(event.target.value)}
      autoComplete="off"
      className={FIELD}
    />
  );
}
