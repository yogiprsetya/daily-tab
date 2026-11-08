import { fileURLToPath } from 'node:url';
// CommonJS package: only the default import works from an .mts file.
import nextEnv from '@next/env';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

// Same env loading as Next.js (.env, .env.local, .env.test, ...).
nextEnv.loadEnvConfig(root);

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Point it at the separate `daily_tab_test` database (see .env.example).'
  );
}
if (testDatabaseUrl === process.env.DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL must differ from DATABASE_URL: tests must never touch the dev database.'
  );
}

export default defineConfig({
  resolve: {
    alias: {
      '@': root,
      // `server-only` throws outside the react-server condition; tests run on the server anyway.
      'server-only': `${root}node_modules/server-only/empty.js`,
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    globalSetup: ['tests/global-setup.ts'],
    env: {
      DATABASE_URL: testDatabaseUrl,
    },
  },
});
