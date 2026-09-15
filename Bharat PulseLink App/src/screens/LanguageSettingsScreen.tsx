/**
 * Bharat PulseLink — Production Language Settings Screen (Prompt 84)
 *
 * Multilingual localization switcher:
 * 1. 10 supported Indian languages with native scripts
 * 2. Instant runtime language switch
 * 3. Preference persistence across app sessions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import i18n, { SupportedLanguage } from '../i18n/i18n';

interface LanguageOption {
  code: SupportedLanguage;
  nameEnglish: string;
  nameNative: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', nameEnglish: 'English (India)', nameNative: 'English' },
  { code: 'hi', nameEnglish: 'Hindi', nameNative: 'हिन्दी' },
  { code: 'ta', nameEnglish: 'Tamil', nameNative: 'தமிழ்' },
  { code: 'te', nameEnglish: 'Telugu', nameNative: 'తెలుగు' },
  { code: 'kn', nameEnglish: 'Kannada', nameNative: 'ಕನ್ನಡ' },
  { code: 'ml', nameEnglish: 'Malayalam', nameNative: 'മലയാളം' },
  { code: 'bn', nameEnglish: 'Bengali', nameNative: 'বাংলা' },
  { code: 'mr', nameEnglish: 'Marathi', nameNative: 'मराठी' },
  { code: 'gu', nameEnglish: 'Gujarati', nameNative: 'ગુજરાતી' },
  { code: 'pa', nameEnglish: 'Punjabi', nameNative: 'ਪੰਜਾਬੀ' },
];

export const LanguageSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [currentLang, setCurrentLang] = useState<string>(i18n.getLanguage() || 'en');

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    await i18n.setLanguage(code);
    setCurrentLang(code);
  };

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

          <Text style={styles.headerTitle}>Language & Region</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBanner}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
              <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#0F766E" strokeWidth={2} />
            </Svg>
            <Text style={styles.infoBannerText}>
              Select your preferred language. Clinical values and prescriptions remain in standard medical nomenclature.
            </Text>
          </View>

          <View style={styles.langListCard}>
            {LANGUAGES.map((lang, index) => {
              const isSelected = currentLang.startsWith(lang.code);
              const isLast = index === LANGUAGES.length - 1;

              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langRow, !isLast && styles.langRowBorder]}
                  onPress={() => handleSelectLanguage(lang.code)}
                  activeOpacity={0.8}
                >
                  <View style={styles.langTextCol}>
                    <Text style={[styles.nativeName, isSelected && styles.selectedText]}>
                      {lang.nameNative}
                    </Text>
                    <Text style={styles.englishName}>{lang.nameEnglish}</Text>
                  </View>

                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: radii.xl,
    padding: 12,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#0F766E',
    lineHeight: 16,
  },
  langListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  langRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  langTextCol: {
    gap: 2,
  },
  nativeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  englishName: {
    fontSize: 11,
    color: '#64748B',
  },
  selectedText: {
    color: '#0F766E',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LanguageSettingsScreen;
