import { describe, expect, it } from 'vitest';
import { EXTENSION_ORIGIN } from './features/auth/request';
import nextConfig from './next.config';

describe('next.config headers', () => {
  it('lets only the extension frame any route', async () => {
    expect(await nextConfig.headers!()).toEqual([
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors ${EXTENSION_ORIGIN}`,
          },
        ],
      },
    ]);
  });
});
