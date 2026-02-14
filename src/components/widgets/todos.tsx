import { Plus, Check } from 'lucide-react';
import { Button } from '~/components/ui/button';

export const TodosWidget = () => {
  return (
    <div className="h-full flex flex-col bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Todos</h2>
        <Button size="icon-sm" variant="ghost" aria-label="Add todo">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant="default" className="h-7">
          All
        </Button>
        <Button size="sm" variant="outline" className="h-7">
          Active
        </Button>
        <Button size="sm" variant="outline" className="h-7">
          Done
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Todo items placeholder */}
        <ul className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted group"
            >
              <button
                className="shrink-0 w-4 h-4 rounded border border-border hover:bg-primary transition-colors"
                aria-label="Toggle todo"
              >
                <Check className="h-3 w-3 text-background hidden" />
              </button>
              <span className="flex-1 text-sm text-foreground">
                Todo item {i + 1}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
