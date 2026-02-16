import { useCallback, useMemo, useState } from 'react';
import { showAlert } from '~/components/ui/alert-provider';
import type { Todo, TodoFilter } from '~/types/todos';
import { todosAdapter } from '~/adapters';
import { generateId } from '~/utils/id';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => todosAdapter.load());
  const [filter, setFilter] = useState<TodoFilter>('active');

  // CREATE
  const addTodo = useCallback(
    (title: string) => {
      const t = title.trim();
      if (!t) return null;
      const newTodo: Todo = {
        id: generateId(),
        title: t,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...todos, newTodo];
      setTodos(updated);
      todosAdapter.save(updated);
      return newTodo;
    },
    [todos]
  );

  // READ
  const getTodos = useCallback(() => todos, [todos]);
  const getTodoById = useCallback(
    (id: string) => {
      return todos.find((t) => t.id === id) || null;
    },
    [todos]
  );

  // UPDATE
  const updateTodo = useCallback(
    (id: string, data: Partial<Pick<Todo, 'title' | 'completed'>>) => {
      const updated = todos.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t
      );
      setTodos(updated);
      todosAdapter.save(updated);
      return updated.find((t) => t.id === id) || null;
    },
    [todos]
  );

  const toggleTodo = useCallback(
    (id: string) => {
      const t = todos.find((x) => x.id === id);
      if (!t) return null;
      return updateTodo(id, { completed: !t.completed });
    },
    [todos, updateTodo]
  );

  // DELETE
  const deleteTodo = useCallback(
    async (id: string) => {
      const updated = todos.filter((t) => t.id !== id);
      setTodos(updated);
      todosAdapter.save(updated);
      await showAlert('Todo deleted');
    },
    [todos]
  );

  const clearCompleted = useCallback(() => {
    const updated = todos.filter((t) => !t.completed);
    setTodos(updated);
    todosAdapter.save(updated);
  }, [todos]);

  const deleteAll = useCallback(() => {
    setTodos([]);
    todosAdapter.clear();
  }, []);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'done':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const counts = useMemo(() => {
    const total = todos.length;
    const done = todos.filter((t) => t.completed).length;
    const active = total - done;
    return { total, active, done };
  }, [todos]);

  return {
    todos,
    filter,
    setFilter,
    filtered,
    counts,
    addTodo,
    getTodos,
    getTodoById,
    updateTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    deleteAll,
  } as const;
}
