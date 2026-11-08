import { apiError } from '@/lib/api';

export const todoNotFound = () => apiError('not_found', 'Todo not found');

export const projectNotFound = () => apiError('not_found', 'Project not found');

export const unknownProject = () =>
  apiError('validation_error', 'Invalid request', [
    { path: ['projectId'], message: 'Project not found' },
  ]);

export const duplicateProject = () =>
  apiError('conflict', 'A project with this name already exists');
