import { z } from 'zod';

// Kept separate from lib/env.ts so drizzle-kit and DB tooling never need AUTH_*.
// No `server-only` import: proxy.ts uses this too. AUTH_* are not NEXT_PUBLIC_,
// so they are undefined in any browser bundle anyway.

const schema = z.object({
  AUTH_PIN: z.string().min(6).max(6),
  AUTH_SECRET: z.string().min(32),
});

const REASON: Record<keyof z.infer<typeof schema>, string> = {
  AUTH_PIN: 'must be at least 6 digits',
  AUTH_SECRET: 'must be at least 32 characters',
};

export type AuthConfig = {
  pin: string;
  secret: Uint8Array;
};

export function parseAuthConfig(
  source: Record<string, string | undefined>
): AuthConfig {
  const result = schema.safeParse(source);

  if (!result.success) {
    // Names and generic reasons only: values are credentials.
    const problems = result.error.issues.map((issue) => {
      const name = issue.path[0] as keyof typeof REASON;
      const reason =
        issue.code === 'invalid_type' ? 'is missing' : REASON[name];
      return `- ${name} ${reason}`;
    });
    throw new Error(`Invalid auth configuration:\n${problems.join('\n')}`);
  }

  return {
    pin: result.data.AUTH_PIN,
    secret: new TextEncoder().encode(result.data.AUTH_SECRET),
  };
}

let cached: AuthConfig | undefined;

export function getAuthConfig(): AuthConfig {
  cached ??= parseAuthConfig(process.env);
  return cached;
}
