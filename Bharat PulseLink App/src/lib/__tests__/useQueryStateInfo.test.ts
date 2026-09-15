import { describe, it, expect } from 'vitest';
import { evaluateQueryState } from '../useQueryStateInfo';
import { UseQueryResult } from '@tanstack/react-query';

describe('Query State Evaluator', () => {
  it('identifies PENDING state when loading', () => {
    const mockQueryResult = {
      isLoading: true,
      isPending: true,
      isError: false,
      data: undefined,
    } as UseQueryResult<any, any>;

    const info = evaluateQueryState(mockQueryResult, true);
    expect(info.state).toBe('PENDING');
    expect(info.isPending).toBe(true);
  });

  it('identifies LIVE state when query is fresh and network is online', () => {
    const mockQueryResult = {
      isLoading: false,
      isPending: false,
      isError: false,
      isStale: false,
      data: { id: 1 },
    } as UseQueryResult<any, any>;

    const info = evaluateQueryState(mockQueryResult, true);
    expect(info.state).toBe('LIVE');
    expect(info.isLive).toBe(true);
  });

  it('identifies OFFLINE_FALLBACK state when offline with cached data', () => {
    const mockQueryResult = {
      isLoading: false,
      isPending: false,
      isError: false,
      isStale: true,
      data: { id: 1 },
    } as UseQueryResult<any, any>;

    const info = evaluateQueryState(mockQueryResult, false);
    expect(info.state).toBe('OFFLINE_FALLBACK');
    expect(info.isOfflineFallback).toBe(true);
  });
});
