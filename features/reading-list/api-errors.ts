import { apiError } from '@/lib/api';

const DUPLICATE_URL = 'This URL is already on your reading list';

export const readingItemNotFound = () =>
  apiError('not_found', 'Reading item not found');

export const topicNotFound = () => apiError('not_found', 'Topic not found');

export const duplicateTopic = () =>
  apiError('conflict', 'A topic with this name already exists');

export const duplicateReadingItem = () =>
  apiError('conflict', DUPLICATE_URL, [
    { path: ['url'], message: DUPLICATE_URL },
  ]);

export const unknownTopic = () =>
  apiError('validation_error', 'Invalid request', [
    { path: ['topicId'], message: 'Topic not found' },
  ]);
