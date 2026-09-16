/**
 * Bharat PulseLink — Enterprise Accessibility Alert Manager
 *
 * Provides real multi-sensory visual and haptic feedback for critical events:
 * 1. QR verification
 * 2. Hospital check-in completion
 * 3. Emergency trigger
 * 4. Security warnings
 * 5. Routing changes
 *
 * Respects `preferences.visualAlerts` and `preferences.hapticFeedback`.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAccessibility } from './AccessibilityContext';
import { spacing, radii } from '../theme/tokens';

export {
  type AlertType,
  type AccessibilityAlertPayload,
  triggerAccessibilityAlert,
} from './accessibilityAlertEvents';
import {
  type AccessibilityAlertPayload,
  subscribeAccessibilityAlert,
} from './accessibilityAlertEvents';

export const AccessibilityAlertBanner: React.FC = () => {
  const { preferences, triggerHaptic, announce, isLargeControls, isHighContrast } =
    useAccessibility();
  const [activeAlert, setActiveAlert] = useState<AccessibilityAlertPayload | null>(null);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const dismissAlert = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: preferences.reducedMotion ? 50 : 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setActiveAlert(null);
    });
  }, [fadeAnim, preferences.reducedMotion]);

  useEffect(() => {
    const handleNewAlert = (alert: AccessibilityAlertPayload) => {
      // Announce for TalkBack
      announce(`${alert.title}. ${alert.message}`);

      // Multi-sensory haptic synchronization
      switch (alert.type) {
        case 'SUCCESS':
          triggerHaptic('success');
          break;
        case 'WARNING':
          triggerHaptic('warning');
          break;
        case 'ERROR':
          triggerHaptic('error');
          break;
        case 'EMERGENCY':
          triggerHaptic('emergency');
          break;
        default:
          triggerHaptic('selection');
          break;
      }

      // If visual alerts are disabled in accessibility settings, do not render banner
      if (!preferences.visualAlerts) {
        return;
      }

      setActiveAlert(alert);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: preferences.reducedMotion ? 50 : 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      const duration = alert.durationMs || (alert.type === 'EMERGENCY' ? 8000 : 4500);
      const timer = setTimeout(dismissAlert, duration);
      return () => clearTimeout(timer);
    };

    listeners.add(handleNewAlert);
    return () => {
      listeners.delete(handleNewAlert);
    };
  }, [preferences.visualAlerts, preferences.reducedMotion, triggerHaptic, announce, dismissAlert, fadeAnim]);

  if (!activeAlert || !preferences.visualAlerts) return null;

  const getAlertColors = () => {
    if (isHighContrast) {
      switch (activeAlert.type) {
        case 'SUCCESS':
          return { bg: '#000000', border: '#059669', text: '#FFFFFF', icon: '#10B981' };
        case 'WARNING':
          return { bg: '#000000', border: '#D97706', text: '#FFFFFF', icon: '#FBBF24' };
        case 'ERROR':
        case 'EMERGENCY':
          return { bg: '#000000', border: '#DC2626', text: '#FFFFFF', icon: '#F87171' };
        default:
          return { bg: '#000000', border: '#FFFFFF', text: '#FFFFFF', icon: '#FFFFFF' };
      }
    }

    switch (activeAlert.type) {
      case 'SUCCESS':
        return { bg: '#ECFDF5', border: '#10B981', text: '#065F46', icon: '#059669' };
      case 'WARNING':
        return { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E', icon: '#D97706' };
      case 'ERROR':
      case 'EMERGENCY':
        return { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', icon: '#DC2626' };
      default:
        return { bg: '#F0FDFA', border: '#0F766E', text: '#115E59', icon: '#0F766E' };
    }
  };

  const scheme = getAlertColors();

  return (
    <Animated.View
      style={[
        styles.overlayContainer,
        { opacity: fadeAnim },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bannerCard,
          { backgroundColor: scheme.bg, borderColor: scheme.border },
          isLargeControls && styles.largeBannerCard,
        ]}
        accessible
        accessibilityRole="alert"
        accessibilityLabel={`${activeAlert.title}: ${activeAlert.message}`}
      >
        <View style={styles.iconCol}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            {activeAlert.type === 'SUCCESS' && (
              <>
                <Circle cx={12} cy={12} r={10} stroke={scheme.icon} strokeWidth={2} />
                <Path d="M8 12l3 3 5-6" stroke={scheme.icon} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {(activeAlert.type === 'ERROR' || activeAlert.type === 'EMERGENCY') && (
              <>
                <Circle cx={12} cy={12} r={10} stroke={scheme.icon} strokeWidth={2} />
                <Path d="M12 8v4M12 16h.01" stroke={scheme.icon} strokeWidth={2.2} strokeLinecap="round" />
              </>
            )}
            {activeAlert.type === 'WARNING' && (
              <Path d="M12 2L1 21h22L12 2zm0 7v5m0 3h.01" stroke={scheme.icon} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            )}
            {activeAlert.type === 'INFORMATION' && (
              <>
                <Circle cx={12} cy={12} r={10} stroke={scheme.icon} strokeWidth={2} />
                <Path d="M12 16v-4M12 8h.01" stroke={scheme.icon} strokeWidth={2.2} strokeLinecap="round" />
              </>
            )}
          </Svg>
        </View>

        <View style={styles.textCol}>
          <Text style={[styles.title, { color: scheme.text }, isLargeControls && styles.largeTitle]}>
            {activeAlert.title}
          </Text>
          <Text style={[styles.message, { color: scheme.text }]} numberOfLines={2}>
            {activeAlert.message}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.closeButton, isLargeControls && styles.largeCloseButton]}
          onPress={dismissAlert}
          accessibilityRole="button"
          accessibilityLabel="Dismiss alert"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke={scheme.text} strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
    alignItems: 'center',
  },
  bannerCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.xl,
    borderWidth: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    gap: spacing.sm,
  },
  largeBannerCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  iconCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  largeTitle: {
    fontSize: 16,
  },
  message: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  closeButton: {
    padding: 6,
    borderRadius: 14,
  },
  largeCloseButton: {
    padding: 10,
  },
});

export default AccessibilityAlertBanner;
