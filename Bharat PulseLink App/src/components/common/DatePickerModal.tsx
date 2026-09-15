import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (formattedDateISO: string) => void;
  initialDateISO?: string;
  title?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDateISO,
  title = 'Select Date of Birth',
}) => {
  const today = new Date();
  const init = initialDateISO ? new Date(initialDateISO) : new Date(1995, 7, 15);
  const [selectedYear, setSelectedYear] = useState<number>(isNaN(init.getFullYear()) ? 1995 : init.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(isNaN(init.getMonth()) ? 7 : init.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState<number>(isNaN(init.getDate()) ? 15 : init.getDate());
  const [viewMode, setViewMode] = useState<'DAYS' | 'YEARS'>('DAYS');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Year range from 1920 to current year
  const currentYear = today.getFullYear();
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);

  // Get number of days in selected month/year
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sun

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => Math.max(1920, y - 1));
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedYear >= currentYear && selectedMonth >= today.getMonth()) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => Math.min(currentYear, y + 1));
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleConfirm = () => {
    const formattedMonth = String(selectedMonth + 1).padStart(2, '0');
    const formattedDay = String(selectedDay).padStart(2, '0');
    const dateStr = `${selectedYear}-${formattedMonth}-${formattedDay}`;
    onSelectDate(dateStr);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>

          {/* Month / Year Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.monthYearHeader} onPress={() => setViewMode(viewMode === 'DAYS' ? 'YEARS' : 'DAYS')}>
              <Text style={styles.monthYearText}>
                {monthNames[selectedMonth]} {selectedYear} ▾
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          {viewMode === 'YEARS' ? (
            <ScrollView style={styles.yearsList} contentContainerStyle={styles.yearsGrid}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearItem, selectedYear === y && styles.yearItemActive]}
                  onPress={() => {
                    setSelectedYear(y);
                    setViewMode('DAYS');
                  }}
                >
                  <Text style={[styles.yearText, selectedYear === y && styles.yearTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.calendarGrid}>
              {/* Day Labels */}
              <View style={styles.weekRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <Text key={d} style={styles.weekLabel}>{d}</Text>
                ))}
              </View>

              {/* Days Matrix */}
              <View style={styles.daysMatrix}>
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <View key={`empty_${i}`} style={styles.dayCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isFuture =
                    selectedYear === currentYear &&
                    selectedMonth === today.getMonth() &&
                    dayNum > today.getDate();
                  const isSelected = selectedDay === dayNum;

                  return (
                    <TouchableOpacity
                      key={`day_${dayNum}`}
                      style={[styles.dayCell, isSelected && styles.dayCellActive]}
                      disabled={isFuture}
                      onPress={() => setSelectedDay(dayNum)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextActive,
                          isFuture && styles.dayTextDisabled,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: typography.titleSmall.fontSize,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthYearHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderRadius: radii.full,
  },
  monthYearText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calendarGrid: {
    marginBottom: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xs,
  },
  weekLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  daysMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: radii.full,
  },
  dayCellActive: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: colors.textMuted,
    opacity: 0.4,
  },
  yearsList: {
    height: 240,
    marginBottom: spacing.md,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  yearItem: {
    width: 70,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearText: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textPrimary,
  },
  yearTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DatePickerModal;
