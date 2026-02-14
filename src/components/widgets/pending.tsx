import { Plus, Bookmark } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';

export const PendingWidget = () => {
  return (
    <ScrollArea className="h-full flex flex-col bg-card p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pending</h2>

          <Button size="icon-sm" variant="ghost" aria-label="Add pending item">
            <Plus className="size-4" />
          </Button>
        </div>

        <p className="text-xs font-medium text-muted-foreground">
          Need attention but later
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Pending items placeholder */}
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => {
            const types = ['Blog Post', 'Video', 'PDF'];
            const type = types[i % types.length];
            return (
              <li
                key={i}
                className="flex items-start gap-2 p-2 rounded-md hover:bg-muted group"
              >
                <Bookmark className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    Pending {type.toLowerCase()} {i + 1}
                  </p>
                  <p className="text-xs text-muted-foreground">5 days ago</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </ScrollArea>
  );
};
