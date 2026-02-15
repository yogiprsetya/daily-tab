import { useRef, useState } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ButtonGroup } from '~/components/ui/button-group';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Checkbox } from '~/components/ui/checkbox';
import type { Todo } from '~/types/todos';
import { useTodos } from '~/state/use-todos';
import { cn } from '~/utils/cn';

export const TodosWidget = () => {
  const {
    filtered,
    filter,
    setFilter,
    counts,
    addTodo,
    updateTodo,
    deleteTodo,
    clearCompleted,
  } = useTodos();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const saveEdit = (todo: Todo, title: string) => {
    const t = title.trim();
    if (!t) return;
    updateTodo(todo.id, { title: t });
    setEditingId(null);
  };

  const handleAdd = () => {
    const t = newTitle.trim();
    if (!t) return;
    addTodo(t);
    setNewTitle('');
    inputRef.current?.focus();
  };

  return (
    <ScrollArea className="h-full flex flex-col bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Todos</h2>

        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New todo"
            className="h-8 w-56"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />

          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Add todo"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <ButtonGroup>
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            className="h-7"
            onClick={() => setFilter('all')}
          >
            All ({counts.total})
          </Button>

          <Button
            size="sm"
            variant={filter === 'active' ? 'default' : 'outline'}
            className="h-7"
            onClick={() => setFilter('active')}
          >
            Active ({counts.active})
          </Button>

          <Button
            size="sm"
            variant={filter === 'done' ? 'default' : 'outline'}
            className="h-7"
            onClick={() => setFilter('done')}
          >
            Done ({counts.done})
          </Button>
        </ButtonGroup>

        {counts.done > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={clearCompleted}
          >
            Clear completed
          </Button>
        )}
      </div>

      <Separator className="mb-3" />

      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {filtered.map((todo) => {
            const isEditing = editingId === todo.id;

            return (
              <li
                key={todo.id}
                className="flex items-center gap-2 px-2 py-1 rounded-sm hover:bg-muted group"
              >
                <Checkbox
                  aria-label="Toggle todo"
                  checked={todo.completed}
                  onCheckedChange={(checked) =>
                    updateTodo(todo.id, { completed: !!checked })
                  }
                />

                {!isEditing ? (
                  <span
                    className={cn(
                      'flex-1 text-sm text-foreground',
                      todo.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {todo.title}
                  </span>
                ) : (
                  <Input
                    autoFocus
                    defaultValue={todo.title}
                    className="flex-1 h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const v = (e.target as HTMLInputElement).value;
                        saveEdit(todo, v);
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                    onBlur={(e) => saveEdit(todo, e.target.value)}
                  />
                )}

                {!isEditing ? (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Edit"
                      onClick={() => setEditingId(todo.id)}
                    >
                      <Pencil />
                    </Button>

                    <Button
                      size="icon-xs"
                      variant="destructive"
                      className="opacity-75"
                      aria-label="Delete"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Cancel"
                    onClick={() => setEditingId(null)}
                  >
                    <X />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </ScrollArea>
  );
};
