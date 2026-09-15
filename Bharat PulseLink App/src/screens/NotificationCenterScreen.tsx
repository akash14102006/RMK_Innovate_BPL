/**
 * Bharat PulseLink — Production Notification Center Screen (Prompt 83)
 *
 * Patient healthcare notifications hub:
 * 1. Categorized notifications (Appointments, Lab Reports, Security, System)
 * 2. Unread indicators and "Mark All Read" action
 * 3. Deep-link navigation triggers
 * 4. Privacy safeguards for sensitive health details.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import AccountManagementService from '../services/AccountManagementService';
import { PatientNotificationItem } from '../types/account';

export const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [notifications, setNotifications] = useState<PatientNotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const loadNotifications = async () => {
    try {
      const data = await AccountManagementService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('[NOTIFS] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await AccountManagementService.markAllNotificationsRead();
    loadNotifications();
  };

  const handlePressNotification = async (item: PatientNotificationItem) => {
    if (!item.isRead) {
      await AccountManagementService.markNotificationRead(item.notificationId);
      loadNotifications();
    }
    if (item.deepLinkRoute) {
      navigation.navigate(item.deepLinkRoute, item.deepLinkParams);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const filtered = notifications.filter((n) => {
    if (selectedCategory === 'ALL') return true;
    return n.category === selectedCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={colors.textPrimary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Notifications</Text>

          <TouchableOpacity onPress={handleMarkAllRead} accessibilityRole="button">
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Bar */}
        <View style={styles.filterBar}>
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 'APPOINTMENT', label: 'Appointments' },
              { id: 'HEALTH_RECORD', label: 'Lab Reports' },
              { id: 'SECURITY', label: 'Security' },
            ] as const
          ).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0F766E" style={{ marginTop: 24 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySub}>You are all caught up!</Text>
            </View>
          ) : (
            filtered.map((item) => (
              <TouchableOpacity
                key={item.notificationId}
                style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
                onPress={() => handlePressNotification(item)}
                activeOpacity={0.85}
              >
                <View style={styles.notifHeaderRow}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{item.category}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(item.timestampISO)}</Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifMessage}>{item.message}</Text>

                {item.deepLinkRoute && (
                  <Text style={styles.tapToViewText}>Tap to view details →</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 12,
    paddingBottom: 40,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  notifCardUnread: {
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
  dateText: {
    fontSize: 10,
    color: '#94A3B8',
    flex: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F766E',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifMessage: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  tapToViewText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
  },
});

export default NotificationCenterScreen;
