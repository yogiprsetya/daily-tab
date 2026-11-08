import { apiError } from '@/lib/api';

export const bookmarkNotFound = () =>
  apiError('not_found', 'Bookmark not found');

export const folderNotFound = () => apiError('not_found', 'Folder not found');

export const duplicateBookmark = () =>
  apiError('conflict', 'This URL is already bookmarked', [
    { path: ['url'], message: 'This URL is already bookmarked' },
  ]);

export const unknownFolder = () =>
  apiError('validation_error', 'Invalid request', [
    { path: ['folderId'], message: 'Folder not found' },
  ]);

export const duplicateFolder = () =>
  apiError('conflict', 'A folder with this name already exists');
