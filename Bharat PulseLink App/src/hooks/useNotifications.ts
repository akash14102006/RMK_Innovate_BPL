import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NotificationService from '../services/NotificationService';
import { NotificationItem, NotificationFilter, GroupedNotifications } from '../types/notifications';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export const useNotifications = (userId: string = 'user_patient_primary', activeFilter: NotificationFilter = 'ALL') => {
  const queryClient = useQueryClient();

  const {
    data: allNotifications = [],
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useQuery<NotificationItem[]>({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, userId],
    queryFn: () => NotificationService.getNotifications(userId),
    staleTime: 1000 * 30, // 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => NotificationService.markAsRead(userId, notificationId),
    onSuccess: (updatedList) => {
      queryClient.setQueryData([...NOTIFICATIONS_QUERY_KEY, userId], updatedList);
      queryClient.invalidateQueries({ queryKey: ['homeDashboard'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationService.markAllAsRead(userId),
    onSuccess: (updatedList) => {
      queryClient.setQueryData([...NOTIFICATIONS_QUERY_KEY, userId], updatedList);
      queryClient.invalidateQueries({ queryKey: ['homeDashboard'] });
    },
  });

  // Apply Filter
  const filteredNotifications = allNotifications.filter((item) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'UNREAD') return !item.isRead;
    return item.category === activeFilter;
  });

  const unreadCount = allNotifications.filter((item) => !item.isRead).length;
  const grouped: GroupedNotifications = NotificationService.groupNotifications(filteredNotifications);

  return {
    notifications: filteredNotifications,
    allNotifications,
    grouped,
    unreadCount,
    isLoading,
    isRefetching,
    refetch,
    isError,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending || markAllAsReadMutation.isPending,
  };
};

export default useNotifications;
