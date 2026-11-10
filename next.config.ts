import type { NextConfig } from 'next';
import { EXTENSION_ORIGIN } from './features/auth/request';

const nextConfig: NextConfig = {
  /* config options here */
  // Only the extension's New Tab page may embed the app.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors ${EXTENSION_ORIGIN}`,
          },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
