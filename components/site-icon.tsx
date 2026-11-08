'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { faviconUrl } from '@/lib/favicon';

/** The letter shows until the icon has actually loaded, so a tile is never blank. */
export function SiteIcon({ title, url }: { title: string; url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = faviconUrl(url);

  return (
    <span className="relative flex size-11 items-center justify-center rounded-lg bg-muted text-base font-semibold text-foreground">
      <span aria-hidden className={cn(loaded && 'invisible')}>
        {title.trim().charAt(0).toUpperCase()}
      </span>
      {src && !failed && (
        // A plain <img>: next/image would route favicons through our server.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          // The image may finish before hydration, when onLoad has no listener yet.
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0) setLoaded(true);
          }}
          src={src}
          alt=""
          width={24}
          height={24}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('absolute size-6', !loaded && 'opacity-0')}
        />
      )}
    </span>
  );
}
