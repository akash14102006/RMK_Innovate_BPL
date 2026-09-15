import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface CareJourneyTimelineProps {
  isProfileComplete?: boolean;
  hasRecords?: boolean;
  hasCare?: boolean;
}

export const CareJourneyTimeline: React.FC<CareJourneyTimelineProps> = ({
  isProfileComplete = false,
  hasRecords = false,
  hasCare = false,
}) => {
  const steps = [
    { id: 'profile', label: 'Profile', isDone: isProfileComplete, isCurrent: !isProfileComplete },
    { id: 'records', label: 'Records', isDone: hasRecords, isCurrent: isProfileComplete && !hasRecords },
    { id: 'care', label: 'Care', isDone: hasCare, isCurrent: hasRecords && !hasCare },
    { id: 'followup', label: 'Follow-up', isDone: false, isCurrent: false },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Care Journey</Text>
        <Text style={styles.brandConcept}>Continuous Health Memory</Text>
      </View>

      <View style={styles.journeyCard}>
        <View style={styles.nodeTrackRow}>
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <View style={styles.nodeCol}>
                <View
                  style={[
                    styles.nodeCircle,
                    step.isDone && styles.nodeCircleDone,
                    step.isCurrent && styles.nodeCircleCurrent,
                  ]}
                >
                  {step.isDone ? (
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  ) : (
                    <View
                      style={[
                        styles.innerDot,
                        step.isCurrent && styles.innerDotCurrent,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.nodeLabel,
                    (step.isDone || step.isCurrent) && styles.nodeLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connecting Line (except for last item) */}
              {idx < steps.length - 1 && (
                <View
                  style={[
                    styles.connectingLine,
                    step.isDone && styles.connectingLineDone,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.titleSmall.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  brandConcept: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
    letterSpacing: 0.2,
  },
  journeyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  nodeTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeCol: {
    alignItems: 'center',
    gap: 6,
    width: 60,
  },
  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  nodeCircleDone: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  nodeCircleCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0F766E',
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: '#94A3B8',
  },
  innerDotCurrent: {
    backgroundColor: '#0F766E',
  },
  nodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  nodeLabelActive: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  connectingLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
    marginHorizontal: -4,
  },
  connectingLineDone: {
    backgroundColor: '#0F766E',
  },
});

export default CareJourneyTimeline;
