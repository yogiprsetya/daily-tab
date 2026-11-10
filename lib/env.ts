import { z } from 'zod';

const postgresUrl = z.url({ protocol: /^postgres(ql)?$/ });

// Empty strings (e.g. `FOO=` copied from .env.example) count as unset.
const optionalPostgresUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  postgresUrl.optional()
);

// Only meaningful when the app runs on the owner's PC; never set in Vercel.
const optionalAbsolutePath = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z
    .string()
    .refine((value) => value.startsWith('/'), 'must be an absolute path')
    .optional()
);

const envSchema = z.object({
  DATABASE_URL: postgresUrl,
  DATABASE_URL_MIGRATE: optionalPostgresUrl,
  TEST_DATABASE_URL: optionalPostgresUrl,
  OBSIDIAN_VAULT_PATH: optionalAbsolutePath,
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    // Only variable names and generic reasons: values may contain credentials.
    const problems = result.error.issues.map((issue) => {
      const name = issue.path.join('.');
      // Custom messages are fixed strings, so they never contain the value.
      const reason =
        issue.code === 'invalid_type'
          ? 'is missing'
          : issue.code === 'custom'
            ? issue.message
            : 'must be a postgres:// or postgresql:// URL';
      return `- ${name} ${reason}`;
    });
    throw new Error(`Invalid environment variables:\n${problems.join('\n')}`);
  }

  return result.data;
}

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
