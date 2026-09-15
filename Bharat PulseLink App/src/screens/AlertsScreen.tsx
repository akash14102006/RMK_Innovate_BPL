import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../theme/tokens';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCategory, NotificationFilter, NotificationItem } from '../types/notifications';

const FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'UNREAD', label: 'Unread' },
  { id: 'SECURITY', label: 'Security' },
  { id: 'ACCOUNT', label: 'Account' },
  { id: 'APPOINTMENT', label: 'Appointments' },
  { id: 'HEALTH_RECORD', label: 'Records' },
  { id: 'MEDICATION', label: 'Medications' },
  { id: 'SYSTEM', label: 'System' },
];

export const AlertsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL');

  const {
    grouped,
    unreadCount,
    isLoading,
    isRefetching,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useNotifications('user_patient_primary', activeFilter);

  const formatRelativeTime = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const handlePressAlert = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.actionRoute) {
      navigation.navigate(item.actionRoute, item.actionParams);
    }
  };

  const renderCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'SECURITY':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0F766E" strokeWidth={2} />
          </Svg>
        );
      case 'ACCOUNT':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#4F46E5" strokeWidth={2} />
            <Circle cx={12} cy={7} r={4} stroke="#4F46E5" strokeWidth={2} />
          </Svg>
        );
      case 'APPOINTMENT':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#0284C7" strokeWidth={2} />
            <Path d="M16 2v4M8 2v4M3 10h18" stroke="#0284C7" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        );
      case 'HEALTH_RECORD':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#059669" strokeWidth={2} />
            <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#059669" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        );
      case 'MEDICATION':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M10.5 13.5L13.5 10.5M7.5 16.5l9-9a4.24 4.24 0 0 0-6-6l-9 9a4.24 4.24 0 0 0 6 6z"
              stroke="#D97706"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'SYSTEM':
      default:
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
              stroke="#0F766E"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
    }
  };

  const renderAlertCard = (item: NotificationItem) => {
    const isActionRequired = item.severity === 'ACTION_REQUIRED';
    const isWarning = item.severity === 'WARNING';
    const isUrgent = item.severity === 'URGENT';

    const borderColor = isUrgent
      ? '#DC2626'
      : isWarning
      ? '#D97706'
      : isActionRequired
      ? '#0F766E'
      : 'rgba(226, 232, 240, 0.9)';

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.alertCard,
          !item.isRead && styles.alertCardUnread,
          { borderLeftColor: borderColor, borderLeftWidth: 3.5 },
        ]}
        onPress={() => handlePressAlert(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.isRead ? 'Read' : 'Unread'}: ${item.title}. ${item.body}`}
        activeOpacity={0.82}
      >
        <View style={styles.cardTop}>
          <View style={styles.iconCircle}>{renderCategoryIcon(item.category)}</View>

          <View style={styles.titleCol}>
            <View style={styles.titleRow}>
              <Text style={[styles.alertTitle, !item.isRead && styles.alertTitleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.timestampText}>{formatRelativeTime(item.timestampISO)}</Text>
          </View>
        </View>

        <Text style={styles.alertBody}>{item.body}</Text>

        {item.actionLabel && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handlePressAlert(item)}
              accessibilityRole="button"
              accessibilityLabel={item.actionLabel}
            >
              <Text style={styles.actionBtnText}>{item.actionLabel} →</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const hasToday = grouped.today.length > 0;
  const hasEarlier = grouped.earlier.length > 0;
  const isEmpty = !hasToday && !hasEarlier;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go Back"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Alerts & Notifications</Text>
            {unreadCount > 0 && <Text style={styles.headerSubtitle}>{unreadCount} unread update{unreadCount > 1 ? 's' : ''}</Text>}
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markReadBtn}
              onPress={() => markAllAsRead()}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerPlaceholder} />
          )}
        </View>

        {/* Filter Chips Horizontal Bar */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {FILTERS.map((f) => {
              const isSelected = activeFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                  onPress={() => setActiveFilter(f.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Alerts List */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#0F766E"
              colors={['#0F766E']}
            />
          }
        >
          {isLoading && !hasToday && !hasEarlier ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0F766E" />
              <Text style={styles.loadingText}>Fetching Alerts...</Text>
            </View>
          ) : isEmpty ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                    stroke="#0F766E"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.emptyTitle}>No Alerts Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'UNREAD'
                  ? 'All notifications are marked as read.'
                  : 'You have no health alerts or reminders in this category.'}
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {/* Today Section */}
              {hasToday && (
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionHeading}>Today</Text>
                  {grouped.today.map(renderAlertCard)}
                </View>
              )}

              {/* Earlier Section */}
              {hasEarlier && (
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionHeading}>Earlier</Text>
                  {grouped.earlier.map(renderAlertCard)}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '700',
    marginTop: 1,
  },
  markReadBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  headerPlaceholder: {
    width: 40,
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    paddingVertical: spacing.xs,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl || 32,
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.titleSmall.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContainer: {
    gap: spacing.md,
  },
  sectionGroup: {
    gap: spacing.xs,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginLeft: 2,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  alertCardUnread: {
    backgroundColor: '#FAFEFD',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    flex: 1,
  },
  alertTitleUnread: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: '#0F766E',
  },
  timestampText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  alertBody: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
    paddingTop: 8,
    marginTop: 2,
  },
  actionBtn: {
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
});

export default AlertsScreen;
