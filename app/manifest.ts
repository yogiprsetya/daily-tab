import type { MetadataRoute } from 'next';

// Matches the dark `--background` token; see app/layout.tsx `viewport.themeColor`.
const BACKGROUND = '#090b0c';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Daily Tab',
    short_name: 'Daily Tab',
    description: 'Shortcuts, todos, bookmarks, reading list and notes.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: BACKGROUND,
    theme_color: BACKGROUND,
    // Sources: public/icons/icon.svg and icon-maskable.svg (see README).
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
