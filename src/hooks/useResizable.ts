import { useState, useRef, useCallback } from 'react';

export const useResizable = (initialSize: number) => {
  const [size, setSize] = useState(initialSize);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, isHorizontal: boolean) => {
      e.preventDefault();
      const startPos = isHorizontal ? e.clientX : e.clientY;
      const startSize = size;
      const container = containerRef.current;
      if (!container) return;

      const parent = container.parentElement;
      if (!parent) return;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - startPos;
        const minSize = 200;
        const newSize = Math.max(minSize, startSize + delta);
        setSize(newSize);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [size]
  );

  return {
    size,
    setSize,
    containerRef,
    handleMouseDown,
  };
};
