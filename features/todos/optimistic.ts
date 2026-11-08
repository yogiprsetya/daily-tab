export type TodoItem = {
  id: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
  url: string | null;
  notes: string | null;
};

export type TodoLists = { pending: TodoItem[]; completed: TodoItem[] };

/** Strips a database row down to what the client needs. */
export const toItem = ({
  id,
  title,
  projectId,
  projectName,
  url,
  notes,
}: TodoItem): TodoItem => ({ id, title, projectId, projectName, url, notes });

/** What the list shows between ticking a box and the server confirming it. */
export function applyToggle(
  state: TodoLists,
  { id, completed }: { id: string; completed: boolean }
): TodoLists {
  const from = completed ? state.pending : state.completed;
  const item = from.find((todo) => todo.id === id);
  if (!item) return state;

  const remaining = from.filter((todo) => todo.id !== id);
  return completed
    ? { pending: remaining, completed: [item, ...state.completed] }
    : { pending: [...state.pending, item], completed: remaining };
}
