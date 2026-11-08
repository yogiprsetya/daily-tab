export const FOREIGN_KEY_VIOLATION = '23503';
export const UNIQUE_VIOLATION = '23505';

/** Drizzle wraps driver errors, so the Postgres code sits on `cause`. */
function pgCode(error: unknown): string | undefined {
  const { code, cause } = error as {
    code?: string;
    cause?: { code?: string };
  };
  return cause?.code ?? code;
}

/** Runs a write, turning known Postgres errors into domain errors. */
export async function translatePgError<T>(
  errors: Record<string, new () => Error>,
  write: () => Promise<T>
): Promise<T> {
  try {
    return await write();
  } catch (error) {
    const DomainError = errors[pgCode(error) ?? ''];
    if (DomainError) throw new DomainError();
    throw error;
  }
}
