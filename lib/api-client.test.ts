import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './api-client';

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('sends a JSON body and returns the parsed response', async () => {
    const fetchMock = stubFetch(async () =>
      Response.json({ id: '1' }, { status: 201 })
    );

    const result = await apiRequest('/api/x', {
      method: 'POST',
      body: { title: 'A' },
    });

    expect(result).toEqual({ ok: true, data: { id: '1' } });
    expect(fetchMock).toHaveBeenCalledWith('/api/x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"title":"A"}',
    });
  });

  it('handles 204 with no body', async () => {
    stubFetch(async () => new Response(null, { status: 204 }));

    expect(await apiRequest('/api/x', { method: 'DELETE' })).toEqual({
      ok: true,
      data: null,
    });
  });

  it('returns the API message and field errors', async () => {
    stubFetch(async () =>
      Response.json(
        {
          error: {
            code: 'validation_error',
            message: 'Invalid request',
            issues: [{ path: ['url'], message: 'Enter a valid URL' }],
          },
        },
        { status: 400 }
      )
    );

    expect(await apiRequest('/api/x', { method: 'POST', body: {} })).toEqual({
      ok: false,
      status: 400,
      message: 'Invalid request',
      fieldErrors: { url: 'Enter a valid URL' },
    });
  });

  it('reports a network failure', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    expect(await apiRequest('/api/x', { method: 'POST' })).toEqual({
      ok: false,
      status: 0,
      message: 'Could not reach the server. Check your connection.',
      fieldErrors: {},
    });
  });

  it('falls back to a generic message for a non-JSON error', async () => {
    stubFetch(async () => new Response('oops', { status: 500 }));

    expect(await apiRequest('/api/x', { method: 'POST' })).toEqual({
      ok: false,
      status: 500,
      message: 'Something went wrong. Try again.',
      fieldErrors: {},
    });
  });
});
