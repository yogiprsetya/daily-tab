export type StoredShortcut = {
  id: string;
  title: string;
  url: string;
  /** Optional group label for organizing shortcuts */
  group?: string;
  createdAt?: number;
  updatedAt?: number;
};
