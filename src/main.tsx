/* eslint-disable @typescript-eslint/no-explicit-any */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import AlertProvider from '~/components/ui/alert-provider';
import { initDefaults } from '~/utils/init';

initDefaults();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AlertProvider>
      <App />
    </AlertProvider>
  </StrictMode>
);

// Register PWA service worker only for GitHub Pages build
declare const BUILD_TARGET: string | undefined;
if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  // vite define can inject BUILD_TARGET via env, fallback to import.meta.env
  (typeof BUILD_TARGET !== 'undefined'
    ? BUILD_TARGET === 'pages'
    : (import.meta as any).env?.BUILD_TARGET === 'pages')
) {
  // vite-plugin-pwa will inject registration automatically with injectRegister: 'auto'
  // This is a safe no-op fallback for environments where auto inject may be disabled
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // ignore
    });
  });
}
