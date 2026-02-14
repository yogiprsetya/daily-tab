import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';

export const NotesWidget = () => {
  return (
    <ScrollArea className="h-full flex flex-col bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Notes</h2>
        <Button size="icon-sm" variant="ghost" aria-label="Add note">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Notes list placeholder */}
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="p-3 rounded-md bg-muted hover:bg-muted/80 cursor-pointer transition-colors group border border-transparent hover:border-border"
            >
              <h3 className="text-sm font-medium text-foreground mb-1">
                Note {i + 1}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                This is a note preview...
              </p>
            </li>
          ))}
        </ul>
      </div>
    </ScrollArea>
  );
};
