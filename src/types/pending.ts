export type PendingType = 'blog' | 'video' | 'pdf' | 'article' | 'other';

export type PendingItem = {
  id: string;
  title: string;
  type: PendingType;
  url?: string;
  createdAt: number;
  updatedAt: number;
};
