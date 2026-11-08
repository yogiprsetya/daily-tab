import { requireSession } from '@/features/auth/require-session';
import { duplicateProject } from '@/features/todos/api-errors';
import {
  DuplicateProjectError,
  createProject,
  listProjects,
} from '@/features/todos/dal';
import { createProjectBody } from '@/features/todos/validation';
import { json, parseBody } from '@/lib/api';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  return json({ items: await listProjects() });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createProjectBody);
  if (!body.ok) return body.response;

  try {
    return json(await createProject(body.data.name), { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateProjectError) return duplicateProject();
    throw error;
  }
}
