import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NotificationAlert } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationAlert[];
  onMarkAllAsRead?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
  notifications,
  onMarkAllAsRead,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Notifications</Text>
              {notifications.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{notifications.length}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close Notifications">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* List of notifications */}
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                    stroke={colors.textMuted}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.emptyTitle}>No unread notifications</Text>
                <Text style={styles.emptyDesc}>You are up to date on your appointments and health records.</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={[styles.notifCard, !item.isRead && styles.notifUnread]}>
                <View style={styles.notifHeader}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifTime}>Just now</Text>
                </View>
                <Text style={styles.notifMsg}>{item.message}</Text>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '65%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  notifCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  notifUnread: {
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifTime: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  notifMsg: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  emptyDesc: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});

export default NotificationsModal;
