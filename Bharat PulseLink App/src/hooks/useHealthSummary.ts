import { useQuery } from '@tanstack/react-query';
import HealthSummaryService from '../services/HealthSummaryService';

export const HEALTH_SUMMARY_QUERY_KEY = ['healthSummary'];

export const useHealthSummary = (userId: string = 'user_patient_primary') => {
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: [...HEALTH_SUMMARY_QUERY_KEY, userId],
    queryFn: () => HealthSummaryService.getHealthSummary(userId),
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    summary: data,
    isLoading,
    isRefetching,
    refetch,
    isError,
  };
};

export default useHealthSummary;
