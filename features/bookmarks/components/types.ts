export type BookmarkItem = {
  id: string;
  title: string;
  url: string;
  notes: string | null;
  folderId: string | null;
  folderName: string | null;
};

export type FolderOption = { id: string; name: string };
