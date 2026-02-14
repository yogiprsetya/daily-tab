import { useState, useEffect, useCallback } from 'react';
import { loadLayout, saveLayout } from '~/utils/settings';

export const useLayout = () => {
  const [leftPanelWidth, setLeftPanelWidth] = useState(
    () => loadLayout().leftPanelWidth
  );

  const [topWidgetHeight, setTopWidgetHeight] = useState(
    () => loadLayout().topWidgetHeight
  );

  const [rightPanelHeight, setRightPanelHeight] = useState(
    () => loadLayout().rightPanelHeight
  );

  useEffect(() => {
    saveLayout({ leftPanelWidth, topWidgetHeight, rightPanelHeight });
  }, [leftPanelWidth, topWidgetHeight, rightPanelHeight]);

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

  const handleTopWidgetResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = topWidgetHeight;
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
        setTopWidgetHeight(newHeight);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [topWidgetHeight]
  );

  const handleRightPanelResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = rightPanelHeight;
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
        setRightPanelHeight(newHeight);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [rightPanelHeight]
  );

  return {
    leftPanelWidth,
    setLeftPanelWidth,
    topWidgetHeight,
    setTopWidgetHeight,
    rightPanelHeight,
    setRightPanelHeight,
    handleLeftPanelResize,
    handleTopWidgetResize,
    handleRightPanelResize,
  };
};
