import { ShortcutsWidget } from '~/components/widgets/shortcuts';
import { TodosWidget } from '~/components/widgets/todos';
import { NotesWidget } from '~/components/widgets/notes';

export const MainLayout = () => {
  return (
    <main className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-32px)]">
        <div className="lg:col-span-2 grid grid-rows-[1fr_auto] gap-4">
          <div className="min-h-0">
            <ShortcutsWidget />
          </div>

          <div className="min-h-0" style={{ gridRow: '2' }}>
            <NotesWidget />
          </div>
        </div>

        <div className="min-h-0">
          <TodosWidget />
        </div>
      </div>
    </main>
  );
};
