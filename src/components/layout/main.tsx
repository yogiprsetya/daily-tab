import { ShortcutsWidget } from '~/components/widgets/shortcuts';
import { TodosWidget } from '~/components/widgets/todos';
import { PendingWidget } from '~/components/widgets/pending';
import { NotesWidget } from '~/components/widgets/notes';
import { ResizeHandle } from '~/components/common/resize-handle';
import { useLayout } from '~/state/use-layout';

export const MainLayout = () => {
  const {
    leftPanelWidth,
    shortcutWidgetHeight,
    handleLeftPanelResize,
    handleShortcutWidgetResize,
  } = useLayout();

  return (
    <main className="m-4 rounded-lg overflow-hidden">
      <div className="flex gap-0 h-[calc(100vh-86px)]">
        <div
          style={{ width: `${leftPanelWidth}%` }}
          className="flex flex-col gap-0 min-w-0"
        >
          <div
            style={{ height: `${shortcutWidgetHeight}%` }}
            className="min-h-0"
          >
            <ShortcutsWidget />
          </div>

          {/* Resize Handle between top and bottom */}
          <ResizeHandle
            isHorizontal={true}
            onMouseDown={handleShortcutWidgetResize}
          />

          <div className="flex gap-0 flex-1 min-h-0">
            <div className="w-1/2 min-w-0">
              <NotesWidget />
            </div>

            <div className="w-1/2 min-w-0">
              <PendingWidget />
            </div>
          </div>
        </div>

        {/* Resize Handle between left and right */}
        <ResizeHandle
          isHorizontal={false}
          onMouseDown={handleLeftPanelResize}
        />

        <div
          style={{ width: `${100 - leftPanelWidth}%` }}
          className="flex flex-col gap-0 min-w-0"
        >
          <TodosWidget />
        </div>
      </div>
    </main>
  );
};
