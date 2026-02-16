import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(() => {
  const isPages = process.env.BUILD_TARGET === 'pages';

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      ...(isPages
        ? [
            VitePWA({
              // Register SW automatically and keep it up-to-date
              registerType: 'autoUpdate',
              injectRegister: 'auto',
              // Avoid generating a web app manifest to prevent conflicts with extension manifest.json
              manifest: false,
              workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                navigateFallback: 'index.html',
                runtimeCaching: [
                  {
                    // HTML documents
                    urlPattern: ({ request }) =>
                      request.destination === 'document',
                    handler: 'NetworkFirst',
                    options: {
                      cacheName: 'pages',
                      expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60 * 60 * 24 * 7,
                      },
                    },
                  },
                  {
                    // JS, CSS, and web workers
                    urlPattern: ({ request }) =>
                      ['style', 'script', 'worker'].includes(
                        request.destination
                      ),
                    handler: 'StaleWhileRevalidate',
                    options: {
                      cacheName: 'assets',
                      expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 60 * 60 * 24 * 30,
                      },
                    },
                  },
                  {
                    // Images (including SVG)
                    urlPattern: ({ request }) =>
                      request.destination === 'image',
                    handler: 'StaleWhileRevalidate',
                    options: {
                      cacheName: 'images',
                      expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 60 * 60 * 24 * 30,
                      },
                    },
                  },
                ],
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  };
});
