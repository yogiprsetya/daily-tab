import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';

export const ShortcutsWidget = () => {
  return (
    <div className="h-full flex flex-col bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Shortcuts</h2>
        <Button size="icon-sm" variant="ghost" aria-label="Add shortcut">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Grid of shortcut tiles placeholder */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-muted rounded-lg border border-border flex items-center justify-center"
            >
              <span className="text-xs text-muted-foreground">
                Shortcut {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
