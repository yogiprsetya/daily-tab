/**
 * Todos Adapter
 * Handles persistence of todos to storage
 */

import type { Todo } from '~/types/todos';
import { storageAdapter } from './storage.adapter';

const TODOS_STORAGE_KEY = 'daily-tab-todos';

export interface TodosAdapter {
  load(): Todo[];
  save(todos: Todo[]): void;
  clear(): void;
}

export const createTodosAdapter = (): TodosAdapter => {
  return {
    load(): Todo[] {
      return storageAdapter.getItem(TODOS_STORAGE_KEY, []);
    },

    save(todos: Todo[]): void {
      storageAdapter.setItem(TODOS_STORAGE_KEY, todos);
    },

    clear(): void {
      storageAdapter.removeItem(TODOS_STORAGE_KEY);
    },
  };
};

export const todosAdapter = createTodosAdapter();
