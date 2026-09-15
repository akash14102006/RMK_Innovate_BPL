import { UseQueryResult } from '@tanstack/react-query';

export type QueryDataState = 'LIVE' | 'CACHED_STALE' | 'PENDING' | 'OFFLINE_FALLBACK' | 'ERROR';

export interface QueryStateDetails {
  state: QueryDataState;
  isLive: boolean;
  isCachedStale: boolean;
  isPending: boolean;
  isOfflineFallback: boolean;
  isError: boolean;
}

export function evaluateQueryState<TData, TError>(
  query: UseQueryResult<TData, TError>,
  isNetworkAvailable: boolean = true
): QueryStateDetails {
  if (query.isLoading || query.isPending) {
    return {
      state: 'PENDING',
      isLive: false,
      isCachedStale: false,
      isPending: true,
      isOfflineFallback: false,
      isError: false,
    };
  }

  if (query.isError) {
    if (query.data !== undefined) {
      return {
        state: 'OFFLINE_FALLBACK',
        isLive: false,
        isCachedStale: true,
        isPending: false,
        isOfflineFallback: true,
        isError: true,
      };
    }
    return {
      state: 'ERROR',
      isLive: false,
      isCachedStale: false,
      isPending: false,
      isOfflineFallback: false,
      isError: true,
    };
  }

  if (!isNetworkAvailable && query.data !== undefined) {
    return {
      state: 'OFFLINE_FALLBACK',
      isLive: false,
      isCachedStale: query.isStale,
      isPending: false,
      isOfflineFallback: true,
      isError: false,
    };
  }

  if (query.isStale) {
    return {
      state: 'CACHED_STALE',
      isLive: false,
      isCachedStale: true,
      isPending: false,
      isOfflineFallback: false,
      isError: false,
    };
  }

  return {
    state: 'LIVE',
    isLive: true,
    isCachedStale: false,
    isPending: false,
    isOfflineFallback: false,
    isError: false,
  };
}
