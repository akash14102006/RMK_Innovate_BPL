import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppointmentService from '../services/AppointmentService';
import { AppointmentTab, AppointmentItem, BookAppointmentPayload } from '../types/appointments';

export const APPOINTMENTS_QUERY_KEY = ['appointments'];

export const useAppointments = (userId: string = 'user_patient_primary') => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AppointmentTab>('UPCOMING');

  const {
    data = { upcoming: [], completed: [] },
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: [...APPOINTMENTS_QUERY_KEY, userId],
    queryFn: () => AppointmentService.getAppointments(userId),
    staleTime: 1000 * 30,
  });

  const cancelMutation = useMutation({
    mutationFn: (appointmentId: string) => AppointmentService.cancelAppointment(userId, appointmentId),
    onSuccess: (updated) => {
      queryClient.setQueryData([...APPOINTMENTS_QUERY_KEY, userId], updated);
      queryClient.invalidateQueries({ queryKey: ['homeDashboard'] });
    },
  });

  const bookMutation = useMutation({
    mutationFn: (payload: BookAppointmentPayload) => AppointmentService.bookAppointment(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...APPOINTMENTS_QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: ['homeDashboard'] });
    },
  });

  const currentList: AppointmentItem[] = activeTab === 'UPCOMING' ? data.upcoming : data.completed;

  return {
    activeTab,
    setActiveTab,
    upcoming: data.upcoming,
    completed: data.completed,
    currentList,
    isLoading,
    isRefetching,
    refetch,
    isError,
    cancelAppointment: cancelMutation.mutate,
    bookAppointment: bookMutation.mutate,
    isMutating: cancelMutation.isPending || bookMutation.isPending,
  };
};

export default useAppointments;
