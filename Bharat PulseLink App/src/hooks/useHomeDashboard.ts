import { useQuery } from '@tanstack/react-query';
import queryKeys from '../lib/queryKeys';
import HomeDashboardService from '../services/HomeDashboardService';
import { HomeDashboardData } from '../types/profile';

export const useHomeDashboard = (userId: string = 'user_patient_primary') => {
  return useQuery<HomeDashboardData, Error>({
    queryKey: queryKeys.home.dashboard(userId),
    queryFn: () => HomeDashboardService.getDashboardData(userId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnReconnect: true,
  });
};

export default useHomeDashboard;
