import { useState, useEffect, useCallback } from 'react';
import { settingsAdapter } from '~/adapters';

export const useLayout = () => {
  const [leftPanelWidth, setLeftPanelWidth] = useState(
    () => settingsAdapter.loadLayout().leftPanelWidth
  );

  const [shortcutWidgetHeight, setShortcutWidgetHeight] = useState(
    () => settingsAdapter.loadLayout().shortcutWidgetHeight
  );

  useEffect(() => {
    settingsAdapter.saveLayout({ leftPanelWidth, shortcutWidgetHeight });
  }, [leftPanelWidth, shortcutWidgetHeight]);

  const handleLeftPanelResize = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [leftPanelWidth]
  );

  const handleShortcutWidgetResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = shortcutWidgetHeight;
      const container = (e.currentTarget as HTMLElement).parentElement;
      if (!container) return;

      const containerHeight = container.offsetHeight;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const deltaPercent = (deltaY / containerHeight) * 100;
        const newHeight = Math.max(
          20,
          Math.min(80, startHeight + deltaPercent)
        );
        setShortcutWidgetHeight(newHeight);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [shortcutWidgetHeight]
  );

  return {
    leftPanelWidth,
    shortcutWidgetHeight,
    handleLeftPanelResize,
    handleShortcutWidgetResize,
  };
};
