import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { ApiError, NetworkError } from './api/errors';
import { reportError } from './monitoring';

/**
 * Expected failures (offline, a refused request) are shown to the user;
 * only server errors and bugs are reported.
 */
export function isUnexpected(error: unknown): boolean {
  if (error instanceof NetworkError) return false;
  if (error instanceof ApiError) return error.status >= 500;
  return true;
}

const report = (error: unknown) => {
  if (isUnexpected(error)) reportError(error);
};

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: report }),
    mutationCache: new MutationCache({ onError: report }),
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
      },
    },
  });
}
