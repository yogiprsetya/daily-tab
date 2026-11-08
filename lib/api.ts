import type { z } from 'zod';

export type ApiErrorCode =
  | 'validation_error'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'internal';

const STATUS: Record<ApiErrorCode, number> = {
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
};

type Issue = { path: PropertyKey[]; message: string };

export type ParseResult<T> =
  { ok: true; data: T } | { ok: false; response: Response };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Route params reach Postgres `uuid` columns; anything else would raise an error there. */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}

export function json<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  issues?: readonly Issue[]
): Response {
  return Response.json(
    { error: { code, message, ...(issues && { issues }) } },
    { status: STATUS[code] }
  );
}

function fromZod<T>(result: z.ZodSafeParseResult<T>): ParseResult<T> {
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    response: apiError(
      'validation_error',
      'Invalid request',
      result.error.issues
    ),
  };
}

export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S
): Promise<ParseResult<z.output<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError('validation_error', 'Request body must be valid JSON'),
    };
  }
  return fromZod(schema.safeParse(body));
}

export function parseQuery<S extends z.ZodType>(
  url: string | URL,
  schema: S
): ParseResult<z.output<S>> {
  const params = Object.fromEntries(new URL(url).searchParams);
  return fromZod(schema.safeParse(params));
}
