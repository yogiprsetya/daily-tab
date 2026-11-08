import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const DB = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

describe('parseEnv', () => {
  it('accepts a valid DATABASE_URL and leaves optional vars undefined', () => {
    const env = parseEnv({ DATABASE_URL: DB });

    expect(env).toEqual({
      DATABASE_URL: DB,
      DATABASE_URL_MIGRATE: undefined,
      TEST_DATABASE_URL: undefined,
    });
  });

  it('accepts optional migrate and test URLs', () => {
    const env = parseEnv({
      DATABASE_URL: DB,
      DATABASE_URL_MIGRATE: 'postgres://u:p@db.example.com:5432/postgres',
      TEST_DATABASE_URL: `${DB}_test`,
    });

    expect(env.DATABASE_URL_MIGRATE).toBe(
      'postgres://u:p@db.example.com:5432/postgres'
    );
    expect(env.TEST_DATABASE_URL).toBe(`${DB}_test`);
  });

  it('treats empty optional vars as unset', () => {
    const env = parseEnv({ DATABASE_URL: DB, DATABASE_URL_MIGRATE: '' });

    expect(env.DATABASE_URL_MIGRATE).toBeUndefined();
  });

  it('names DATABASE_URL in the error when it is missing', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejects a URL that is not a Postgres connection string', () => {
    expect(() => parseEnv({ DATABASE_URL: 'https://example.com' })).toThrow(
      /DATABASE_URL/
    );
  });

  it('rejects a value that is not a URL', () => {
    expect(() => parseEnv({ DATABASE_URL: 'not a url' })).toThrow(
      /DATABASE_URL/
    );
  });

  it('does not leak secret values into the error message', () => {
    expect(() =>
      parseEnv({ DATABASE_URL: 'https://user:s3cret@example.com' })
    ).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining('s3cret'),
      })
    );
  });
});
