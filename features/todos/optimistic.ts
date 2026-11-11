export type TodoItem = {
  id: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
  url: string | null;
  notes: string | null;
};

/** A `GET /api/todos` row: the API sends `completedAt` rather than a flag. */
export type TodoRow = TodoItem & { completedAt: string | null };

export type TodoLists<T extends TodoItem = TodoItem> = {
  pending: T[];
  completed: T[];
};

/** Strips a database row down to what the client needs. */
export const toItem = ({
  id,
  title,
  projectId,
  projectName,
  url,
  notes,
}: TodoItem): TodoItem => ({ id, title, projectId, projectName, url, notes });

/** The GET returns pending oldest first, then completed newest first. */
export function splitTodos(rows: TodoRow[]): TodoLists<TodoRow> {
  return {
    pending: rows.filter((row) => row.completedAt === null),
    completed: rows.filter((row) => row.completedAt !== null),
  };
}
