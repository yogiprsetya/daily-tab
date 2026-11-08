import Link from 'next/link';
import { requirePageSession } from '@/features/auth/require-session';
import { countPending, listPending } from '../dal';
import { toItem } from '../optimistic';
import { SECTION_HEADING } from './styles';
import { TodoList } from './todo-list';

const HOME_LIMIT = 5;

/** Reads the session and the database: render inside <Suspense>. */
export async function PendingSection() {
  await requirePageSession();
  const [pending, total] = await Promise.all([
    listPending({ kind: 'all' }, HOME_LIMIT),
    countPending(),
  ]);

  return (
    <>
      <div className="flex min-h-11 items-center justify-between gap-2">
        <h2 id="pending-heading" className={SECTION_HEADING}>
          Pending tasks
        </h2>
        <Link
          href="/todos"
          className="-mr-3 flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all ({total})
        </Link>
      </div>
      <TodoList pending={pending.map(toItem)} completed={[]} />
    </>
  );
}
