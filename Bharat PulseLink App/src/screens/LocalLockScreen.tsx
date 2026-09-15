import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { motionTokens } from '../theme/motion';
import useReducedMotion from '../theme/useReducedMotion';
import { useI18n } from '../i18n/I18nContext';
import GlassCard from '../components/GlassCard';
import LottieHero from '../components/LottieHero';
import DeviceSecurityService from '../services/DeviceSecurityService';

type Props = NativeStackScreenProps<AuthStackParamList, 'LocalLock'>;

const pinSecurityLottie = require('../../assets/animations/pin-security.json');

export const LocalLockScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Motion Animators
  const heroScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.94)).current;
  const contentOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    console.log('[ROUTE] LOCAL_LOCK');

    if (reduceMotion) return;

    Animated.parallel([
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: motionTokens.duration.normal,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion]);

  // Lockout Timer Interval
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleKeyPress = async (digit: string) => {
    if (pinInput.length >= 6 || lockoutSeconds > 0) return;
    setErrorMessage(null);

    const nextPin = pinInput + digit;
    setPinInput(nextPin);

    if (nextPin.length === 6) {
      const isValid = await DeviceSecurityService.verifySecurityPin(nextPin);
      if (isValid) {
        console.log('[LOCAL_LOCK] PIN_VERIFIED_SUCCESS');
        DeviceSecurityService.unlockApp();
        navigation.navigate('AuthEntry');
      } else {
        const remaining = DeviceSecurityService.getLockoutSeconds();
        if (remaining > 0) {
          setLockoutSeconds(remaining);
          setErrorMessage(t('lock.lockoutMessage', { seconds: remaining }));
        } else {
          setErrorMessage(t('lock.incorrectPin') || 'Incorrect Security PIN. Please try again.');
        }
        setPinInput('');
      }
    }
  };

  const handleDelete = () => {
    if (lockoutSeconds > 0) return;
    setErrorMessage(null);
    setPinInput((prev) => prev.slice(0, -1));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Lock Hero Visual */}
          <Animated.View style={[styles.heroSection, { transform: [{ scale: heroScale }] }]}>
            <LottieHero
              source={pinSecurityLottie}
              aspectRatio={316.81 / 319.05}
              sizeRatio={0.58}
              maxWidth={200}
              autoPlay={!reduceMotion}
              loop={!reduceMotion}
              reducedMotion={reduceMotion}
              accessibilityLabel={t('lock.title')}
            />
          </Animated.View>

          {/* Heading */}
          <Animated.View style={[styles.headingSection, { opacity: contentOpacity }]}>
            <Text style={styles.title}>{t('lock.title') || 'App Locked'}</Text>
            <Text style={styles.subtitle}>
              {t('lock.subtitle') || 'Enter your Security PIN to continue'}
            </Text>
          </Animated.View>

          {/* Glass Card Input */}
          <Animated.View style={[styles.cardWrapper, { opacity: contentOpacity }]}>
            <GlassCard style={styles.glassCard}>
              {errorMessage && (
                <View style={styles.errorNotice} accessible accessibilityRole="alert">
                  <Text style={styles.errorNoticeText}>{errorMessage}</Text>
                </View>
              )}

              {/* 6 Masked PIN Indicator Dots */}
              <View style={styles.dotsRow}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const filled = pinInput.length > index;
                  return (
                    <View
                      key={index}
                      style={[styles.dotCell, filled && styles.dotCellFilled]}
                    >
                      {filled && <View style={styles.dotInner} />}
                    </View>
                  );
                })}
              </View>

              {/* Numeric Keypad */}
              <View style={styles.keypadGrid}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(
                  (key, idx) => {
                    if (key === '') return <View key={idx} style={styles.keypadCell} />;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.keypadCell,
                          lockoutSeconds > 0 && styles.keypadCellDisabled,
                        ]}
                        onPress={() => (key === '⌫' ? handleDelete() : handleKeyPress(key))}
                        disabled={lockoutSeconds > 0}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.keypadText}>{key}</Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: typography.titleLarge.fontWeight,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardWrapper: {
    width: '100%',
  },
  glassCard: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.md,
  },
  errorNotice: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  errorNoticeText: {
    color: colors.danger,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dotCell: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textMuted,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCellFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    justifyContent: 'center',
  },
  keypadCell: {
    width: 70,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    borderRadius: radii.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  keypadCellDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  keypadText: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default LocalLockScreen;
