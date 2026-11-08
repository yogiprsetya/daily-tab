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
    // DB-backed tests truncate shared tables; running files in parallel would race.
    fileParallelism: false,
    env: {
      DATABASE_URL: testDatabaseUrl,
      // Fixed fake credentials: tests must never see the real AUTH_* values.
      AUTH_EMAIL: 'owner@example.com',
      AUTH_PIN: '482913',
      AUTH_SECRET: 'test-only-secret-0123456789abcdef',
    },
  },
});
