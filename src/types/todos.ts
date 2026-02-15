export type TodoFilter = 'all' | 'active' | 'done';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}
