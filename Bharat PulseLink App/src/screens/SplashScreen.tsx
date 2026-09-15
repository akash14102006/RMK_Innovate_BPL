import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
  Image,
} from 'react-native';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { motionTokens } from '../theme/motion';
import useReducedMotion from '../theme/useReducedMotion';
import SessionManager from '../services/sessionManager';
import { useI18n } from '../i18n/I18nContext';

export type SplashStage = 'CIRCULAR' | 'NORMAL_LOGO' | 'EXIT' | 'FAILED';

interface SplashScreenProps {
  onBootComplete?: (isAuthenticated: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onBootComplete }) => {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const [stage, setStage] = useState<SplashStage>('CIRCULAR');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sizing
  const circleSize = Math.min(360, Math.max(260, width * 0.72));
  const logoWidthInCircle = circleSize * 0.76;
  const logoHeightInCircle = logoWidthInCircle / 1.742;

  const normalLogoWidth = Math.min(340, Math.max(240, width * 0.68));
  const normalLogoHeight = normalLogoWidth / 1.742;

  // Animation Values
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0.94)).current;
  const circleLogoOpacity = useRef(new Animated.Value(0)).current;
  const circleLogoScale = useRef(new Animated.Value(0.90)).current;

  const normalLogoOpacity = useRef(new Animated.Value(0)).current;
  const normalLogoScale = useRef(new Animated.Value(0.95)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const bootstrapResultRef = useRef<boolean | null>(null);
  const hasExitedRef = useRef(false);

  const attemptExit = (isAuthenticated: boolean) => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;

    console.log('[BOOT] SPLASH_STAGE=EXIT');
    setStage('EXIT');

    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: reduceMotion ? motionTokens.duration.fast : motionTokens.duration.normal,
      useNativeDriver: true,
    }).start(() => {
      onBootComplete?.(isAuthenticated);
    });
  };

  const runBootstrap = async () => {
    try {
      console.log('[BOOT] SESSION_INIT_START');
      await SessionManager.init();
      const token = await SessionManager.getAccessToken();
      console.log('[BOOT] SESSION_INIT_DONE', { hasToken: !!token });
      bootstrapResultRef.current = !!token;
    } catch (err) {
      console.log('[BOOT] SESSION_INIT_ERROR_FALLBACK', err);
      bootstrapResultRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Stage 1: Circular Splash
    console.log('[BOOT] SPLASH_STAGE=CIRCULAR');
    runBootstrap();

    if (reduceMotion) {
      circleOpacity.setValue(0);
      normalLogoOpacity.setValue(1);
      normalLogoScale.setValue(1);
      console.log('[BOOT] SPLASH_STAGE=NORMAL_LOGO');
      setStage('NORMAL_LOGO');

      const holdTimer = setTimeout(() => {
        if (isMounted) {
          attemptExit(bootstrapResultRef.current ?? false);
        }
      }, 1500);

      return () => {
        isMounted = false;
        clearTimeout(holdTimer);
      };
    }

    // Motion Sequence
    // 1. Reveal Circular Splash (0 - 500ms)
    Animated.parallel([
      Animated.timing(circleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(circleScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(circleLogoOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(circleLogoScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!isMounted) return;

      // 2. Transition to Stage 2: Normal Large Logo Hold (~2 seconds)
      console.log('[BOOT] SPLASH_STAGE=NORMAL_LOGO');
      setStage('NORMAL_LOGO');

      Animated.parallel([
        Animated.timing(circleOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(circleLogoOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(normalLogoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(normalLogoScale, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!isMounted) return;

        // Hold Normal Logo for ~1800ms (total ~2.2 seconds visual presentation)
        const holdTimer = setTimeout(() => {
          if (isMounted) {
            attemptExit(bootstrapResultRef.current ?? false);
          }
        }, 1800);

        return () => clearTimeout(holdTimer);
      });
    });

    // Fallback Timer Safety
    const maxBootTimer = setTimeout(() => {
      if (isMounted && !hasExitedRef.current) {
        console.log('[BOOT] MAX_BOOT_TIMER_TRIGGERED_FALLBACK');
        attemptExit(bootstrapResultRef.current ?? false);
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearTimeout(maxBootTimer);
    };
  }, []);

  return (
    <Animated.View
      style={[styles.container, { opacity: screenOpacity }]}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Bharat PulseLink Splash Screen"
    >
      {/* Stage 1: Circular Pale-Teal Background Field */}
      <Animated.View
        style={[
          styles.paleTealCircle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            opacity: circleOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: circleLogoOpacity,
              transform: [{ scale: circleLogoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: logoWidthInCircle, height: logoHeightInCircle }}
            resizeMode="contain"
            accessibilityLabel="Bharat PulseLink Logo"
          />
        </Animated.View>
      </Animated.View>

      {/* Stage 2: Normal Large Standalone Centered Logo (No Circle) */}
      <Animated.View
        style={[
          styles.normalLogoContainer,
          {
            opacity: normalLogoOpacity,
            transform: [{ scale: normalLogoScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: normalLogoWidth, height: normalLogoHeight }}
          resizeMode="contain"
          accessibilityLabel="Bharat PulseLink Official Logo"
        />
      </Animated.View>

      {/* Error Recovery UI */}
      {stage === 'FAILED' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage || t('common.error')}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={runBootstrap}
            accessibilityRole="button"
            accessibilityLabel={t('common.retry')}
          >
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  paleTealCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A6EBDC',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  normalLogoContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.bodyMedium.fontSize,
    marginBottom: spacing.sm,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.textInverted,
    fontWeight: '600',
  },
});

export default SplashScreen;
