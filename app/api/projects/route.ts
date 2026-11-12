import { requireSession } from '@/features/auth/require-session';
import { duplicateProject } from '@/features/todos/api-errors';
import {
  DuplicateProjectError,
  countPending,
  createProject,
  listProjects,
  pendingWithoutProject,
} from '@/features/todos/dal';
import { createProjectBody } from '@/features/todos/validation';
import { json, parseBody } from '@/lib/api';
import { invalidateData } from '@/lib/server-cache';

/** `total` and `withoutProject` feed the All and No project filter counts. */
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const [items, total, withoutProject] = await Promise.all([
    listProjects(),
    countPending(),
    pendingWithoutProject(),
  ]);

  return json({ items, total, withoutProject });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createProjectBody);
  if (!body.ok) return body.response;

  try {
    const project = await createProject(body.data.name);
    invalidateData('projects', 'todos');
    return json(project, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateProjectError) return duplicateProject();
    throw error;
  }
}
