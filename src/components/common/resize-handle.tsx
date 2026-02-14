import { GripVertical } from 'lucide-react';
import { cn } from '~/utils/cn';

interface ResizeHandleProps {
  isHorizontal?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export const ResizeHandle = ({
  isHorizontal = false,
  onMouseDown,
}: ResizeHandleProps) => {
  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        'group transition-colors flex items-center justify-center bg-border/50',
        isHorizontal
          ? 'h-1 cursor-row-resize hover:bg-primary/20'
          : 'w-1 cursor-col-resize hover:bg-primary/20'
      )}
    >
      <GripVertical
        className={cn(
          'h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity',
          isHorizontal && 'rotate-90'
        )}
      />
    </div>
  );
};
