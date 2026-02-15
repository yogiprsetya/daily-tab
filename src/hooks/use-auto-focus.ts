import { useEffect, useRef } from 'react';

export function useAutoFocus<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (enabled && ref.current) {
      // Defer to next tick to ensure element is mounted
      setTimeout(() => ref.current?.focus(), 0);
    }
  }, [enabled]);

  return ref;
}
