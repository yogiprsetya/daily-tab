import { useState } from 'react';
import { ShortcutsWidget } from '~/components/widgets/shortcuts';
import { TodosWidget } from '~/components/widgets/todos';
import { NotesWidget } from '~/components/widgets/notes';
import { ResizeHandle } from '~/components/common/resize-handle';

export const MainLayout = () => {
  const [leftPanelWidth, setLeftPanelWidth] = useState(66); // percentage
  const [topWidgetHeight, setTopWidgetHeight] = useState(50); // percentage

  const handleLeftPanelResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    const container = (e.currentTarget as HTMLElement).parentElement;
    if (!container) return;

    const containerWidth = container.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(40, Math.min(80, startWidth + deltaPercent));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTopWidgetResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = topWidgetHeight;
    const container = (e.currentTarget as HTMLElement).parentElement;
    if (!container) return;

    const containerHeight = container.offsetHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaPercent = (deltaY / containerHeight) * 100;
      const newHeight = Math.max(20, Math.min(80, startHeight + deltaPercent));
      setTopWidgetHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const rightPanelWidth = 100 - leftPanelWidth;

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

        <div style={{ width: `${rightPanelWidth}%` }} className="min-h-0">
          <TodosWidget />
        </div>
      </div>
    </main>
  );
};
