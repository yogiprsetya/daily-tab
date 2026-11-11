import { apiRequest } from '@/lib/api-client';
import { type FeatureKey, keyPath } from './keys';

/**
 * SWR fetcher: unwraps the ApiResult envelope, throwing on failure so the hook
 * reports `error` instead of handing a failure on as data.
 */
export async function fetcher<T>(key: FeatureKey | string): Promise<T> {
  const result = await apiRequest<T>(keyPath(key), { method: 'GET' });
  if (!result.ok) throw new Error(result.message);
  return result.data;
}
