import { ShortcutsWidget } from '~/components/widgets/shortcuts';
import { TodosWidget } from '~/components/widgets/todos';
import { PendingWidget } from '~/components/widgets/pending';
import { NotesWidget } from '~/components/widgets/notes';
import { ResizeHandle } from '~/components/common/resize-handle';
import { useLayout } from '~/state/use-layout';

export const MainLayout = () => {
  const {
    leftPanelWidth,
    topWidgetHeight,
    rightPanelHeight,
    handleLeftPanelResize,
    handleTopWidgetResize,
    handleRightPanelResize,
  } = useLayout();

  return (
    <main className="m-4 rounded-lg overflow-hidden">
      <div className="flex gap-0 h-[calc(100vh-86px)]">
        <div
          style={{ width: `${leftPanelWidth}%` }}
          className="flex flex-col gap-0 min-w-0"
        >
          <div style={{ height: `${topWidgetHeight}%` }} className="min-h-0">
            <ShortcutsWidget />
          </div>

          {/* Resize Handle between top and bottom */}
          <ResizeHandle
            isHorizontal={true}
            onMouseDown={handleTopWidgetResize}
          />

          <div
            style={{ height: `${100 - topWidgetHeight}%` }}
            className="min-h-0"
          >
            <NotesWidget />
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
          <div style={{ height: `${rightPanelHeight}%` }} className="min-h-0">
            <TodosWidget />
          </div>

          {/* Resize Handle between todos and watch later */}
          <ResizeHandle
            isHorizontal={true}
            onMouseDown={handleRightPanelResize}
          />

          <div
            style={{ height: `${100 - rightPanelHeight}%` }}
            className="min-h-0"
          >
            <PendingWidget />
          </div>
        </div>
      </div>
    </main>
  );
};
