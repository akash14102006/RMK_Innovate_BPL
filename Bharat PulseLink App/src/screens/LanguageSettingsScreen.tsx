/**
 * Bharat PulseLink — Production Language Settings Screen (Prompt 84 & Master Prompt)
 *
 * Multilingual localization switcher:
 * 1. 23 official Indian languages with native typography & scripts
 * 2. Instant runtime language switch across all app screens
 * 3. Searchable language catalog
 * 4. Active language indicator with checkmark (✓) and unselected radio (○)
 * 5. Preference persistence across app sessions.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import { useI18n } from '../i18n/I18nContext';
import { ALL_SCHEDULED_LANGUAGES, LanguageDescriptor } from '../i18n/languages';

export const LanguageSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { language, setLanguage, descriptor, t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ALL_SCHEDULED_LANGUAGES;
    return ALL_SCHEDULED_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.englishName.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q) ||
        lang.script.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectLanguage = async (code: string) => {
    await setLanguage(code);
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
            accessibilityLabel={t('common.back')}
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

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('settings.languageRegion') || 'Language & Region'}</Text>
            <Text style={styles.headerSub}>
              {descriptor.nativeName} ({descriptor.englishName})
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
              <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#0F766E" strokeWidth={2} />
            </Svg>
            <Text style={styles.infoBannerText}>
              {t('settings.selectLanguageNotice') ||
                'Select your preferred language. The entire application will operate in this language.'}
            </Text>
          </View>

          {/* Search Box */}
          <View style={styles.searchBar}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
              <Circle cx={11} cy={11} r={8} stroke="#64748B" strokeWidth={2} />
              <Path d="M21 21l-4.35-4.35" stroke="#64748B" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder={t('common.search') ? `${t('common.search')}...` : 'Search languages...'}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Languages List Card */}
          <View style={styles.langListCard}>
            {filteredLanguages.map((lang: LanguageDescriptor, index: number) => {
              const isSelected =
                language === lang.code ||
                language === lang.languageCode ||
                descriptor.code === lang.code;
              const isLast = index === filteredLanguages.length - 1;

              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langRow, !isLast && styles.langRowBorder, isSelected && styles.langRowSelected]}
                  onPress={() => handleSelectLanguage(lang.code)}
                  activeOpacity={0.78}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${lang.nativeName}, ${lang.englishName}, ${lang.script} script`}
                >
                  <View style={styles.langTextCol}>
                    <View style={styles.langTitleRow}>
                      <Text style={[styles.nativeName, isSelected && styles.selectedText]}>
                        {lang.nativeName}
                      </Text>
                      <View style={styles.scriptBadge}>
                        <Text style={styles.scriptText}>{lang.script}</Text>
                      </View>
                    </View>
                    <Text style={styles.englishName}>{lang.englishName}</Text>
                  </View>

                  {/* Radio / Check Circle indicator */}
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                    {isSelected ? (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    ) : (
                      <View style={styles.unselectedDot} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredLanguages.length === 0 && (
              <View style={styles.emptyView}>
                <Text style={styles.emptyText}>No languages match "{searchQuery}"</Text>
              </View>
            )}
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
    marginTop: 1,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 14,
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
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
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
  langRowSelected: {
    backgroundColor: 'rgba(15, 118, 110, 0.03)',
  },
  langRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  langTextCol: {
    gap: 2,
    flex: 1,
  },
  langTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nativeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  scriptBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  scriptText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
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
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkCircleSelected: {
    borderColor: '#0F766E',
    backgroundColor: '#0F766E',
  },
  unselectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  emptyView: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default LanguageSettingsScreen;
