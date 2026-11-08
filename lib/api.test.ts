import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { apiError, isUuid, json, parseBody, parseQuery } from './api';

const schema = z.object({ title: z.string().min(1) });

function post(body: string) {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

describe('isUuid', () => {
  it('accepts a UUID in either case', () => {
    expect(isUuid('6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c')).toBe(true);
    expect(isUuid('6F1D2C3A-9B4E-4F7A-8C21-0D5E6F7A8B9C')).toBe(true);
  });

  it.each(['', 'abc', '1', '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9', "1' or '1"])(
    'rejects %j',
    (value) => {
      expect(isUuid(value)).toBe(false);
    }
  );
});

describe('json', () => {
  it('returns a 200 JSON response by default', async () => {
    const res = json({ ok: true });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('honours a custom status', () => {
    expect(json({ id: 1 }, { status: 201 }).status).toBe(201);
  });
});

describe('apiError', () => {
  it.each([
    ['validation_error', 400],
    ['unauthorized', 401],
    ['not_found', 404],
    ['forbidden', 403],
    ['rate_limited', 429],
    ['internal', 500],
  ] as const)('maps %s to HTTP %i', async (code, status) => {
    const res = apiError(code, 'Something happened');

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({
      error: { code, message: 'Something happened' },
    });
  });

  it('includes issues when given', async () => {
    const issues = [{ path: ['title'], message: 'Required' }];
    const body = await apiError('validation_error', 'Invalid', issues).json();

    expect(body.error.issues).toEqual(issues);
  });
});

describe('parseBody', () => {
  it('returns parsed data for a valid body', async () => {
    const result = await parseBody(post('{"title":"Read docs"}'), schema);

    expect(result).toEqual({ ok: true, data: { title: 'Read docs' } });
  });

  it('returns a 400 validation_error with issues for an invalid body', async () => {
    const result = await parseBody(post('{"title":""}'), schema);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    const body = await result.response.json();
    expect(result.response.status).toBe(400);
    expect(body.error.code).toBe('validation_error');
    expect(body.error.issues[0].path).toEqual(['title']);
  });

  it('returns a 400 validation_error for malformed JSON', async () => {
    const result = await parseBody(post('{not json'), schema);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    const body = await result.response.json();
    expect(result.response.status).toBe(400);
    expect(body.error).toEqual({
      code: 'validation_error',
      message: 'Request body must be valid JSON',
    });
  });
});

describe('parseQuery', () => {
  const querySchema = z.object({
    project: z.string().optional(),
    limit: z.coerce.number().int().positive().default(20),
  });

  it('parses search params from a URL string', () => {
    const result = parseQuery(
      'http://localhost/api/todos?project=home&limit=5',
      querySchema
    );

    expect(result).toEqual({ ok: true, data: { project: 'home', limit: 5 } });
  });

  it('applies schema defaults when params are absent', () => {
    const result = parseQuery(
      new URL('http://localhost/api/todos'),
      querySchema
    );

    expect(result).toEqual({ ok: true, data: { limit: 20 } });
  });

  it('returns a 400 validation_error for invalid params', async () => {
    const result = parseQuery(
      'http://localhost/api/todos?limit=-1',
      querySchema
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
    expect((await result.response.json()).error.issues[0].path).toEqual([
      'limit',
    ]);
  });
});
