import { apiError } from '@/lib/api';

const DUPLICATE_URL = 'This URL is already on your reading list';

export const duplicateReadingItem = () =>
  apiError('conflict', DUPLICATE_URL, [
    { path: ['url'], message: DUPLICATE_URL },
  ]);

export const unknownTopic = () =>
  apiError('validation_error', 'Invalid request', [
    { path: ['topicId'], message: 'Topic not found' },
  ]);
