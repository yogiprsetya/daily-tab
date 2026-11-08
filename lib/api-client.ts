export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      message: string;
      fieldErrors: Record<string, string>;
    };

const GENERIC = 'Something went wrong. Try again.';

type ErrorBody = {
  error?: {
    message?: string;
    issues?: { path: PropertyKey[]; message: string }[];
  };
};

/** Same-origin JSON request for client components; never throws. */
export async function apiRequest<T = unknown>(
  path: string,
  { method, body }: { method: string; body?: unknown }
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      ...(body !== undefined && {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: 'Could not reach the server. Check your connection.',
      fieldErrors: {},
    };
  }

  if (res.status === 204) return { ok: true, data: null as T };

  const payload: unknown = await res.json().catch(() => null);
  if (res.ok) return { ok: true, data: payload as T };

  const error = (payload as ErrorBody | null)?.error;
  const fieldErrors: Record<string, string> = {};
  for (const issue of error?.issues ?? []) {
    const field = String(issue.path[0] ?? '');
    if (field) fieldErrors[field] ??= issue.message;
  }
  return {
    ok: false,
    status: res.status,
    message: error?.message ?? GENERIC,
    fieldErrors,
  };
}
