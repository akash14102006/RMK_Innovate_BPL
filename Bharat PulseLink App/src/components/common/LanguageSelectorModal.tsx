/**
 * Bharat PulseLink — Production Language Selector Modal
 *
 * Enterprise accessible bottom-sheet language picker:
 * 1. Live search across 23 official Indian languages (native name, English name, script)
 * 2. Instant runtime language switch with persistent preference storage
 * 3. Clear selected state indicator with authentic checkmark (✓) and unselected radio (○)
 * 4. Fully compliant with existing design system (no UI redesign)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../../theme/tokens';
import { useI18n } from '../../i18n/I18nContext';
import { ALL_SCHEDULED_LANGUAGES, LanguageDescriptor } from '../../i18n/languages';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLanguage?: (code: string) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  onClose,
  onSelectLanguage,
}) => {
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

  const handleSelect = async (code: string) => {
    await setLanguage(code);
    if (onSelectLanguage) {
      onSelectLanguage(code);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss language selector"
        />

        <View style={styles.modalCard}>
          {/* Top Handle bar */}
          <View style={styles.handleBar} />

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.globeIcon}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                  <Path
                    d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                    stroke="#0F766E"
                    strokeWidth={2}
                  />
                </Svg>
              </View>
              <View>
                <Text style={styles.title}>{t('settings.languageRegion') || 'Language & Region'}</Text>
                <Text style={styles.subtitle}>
                  {descriptor.nativeName} ({descriptor.englishName}) • 23 Official Locales
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close language selector"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
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
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Languages List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredLanguages.map((lang: LanguageDescriptor) => {
              const isSelected =
                language === lang.code ||
                language === lang.languageCode ||
                descriptor.code === lang.code;

              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langCard, isSelected && styles.langCardSelected]}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.78}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${lang.nativeName}, ${lang.englishName}, ${lang.script} script`}
                >
                  <View style={styles.langInfo}>
                    <View style={styles.langNameRow}>
                      <Text style={[styles.nativeName, isSelected && styles.nativeNameSelected]}>
                        {lang.nativeName}
                      </Text>
                      <View style={styles.scriptBadge}>
                        <Text style={styles.scriptText}>{lang.script}</Text>
                      </View>
                    </View>
                    <Text style={styles.englishName}>{lang.englishName}</Text>
                  </View>

                  {/* Radio / Checkbox Indicator (Phase 7 ✓ / ○) */}
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                    {isSelected ? (
                      <Text style={styles.checkMark}>✓</Text>
                    ) : (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredLanguages.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No languages found matching "{searchQuery}"</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    maxHeight: SCREEN_HEIGHT * 0.82,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  globeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  scrollList: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  scrollContent: {
    gap: 8,
    paddingBottom: 24,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radii.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 58,
  },
  langCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDFA',
  },
  langInfo: {
    flex: 1,
    gap: 2,
  },
  langNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nativeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  nativeNameSelected: {
    color: colors.primary,
  },
  scriptBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    fontWeight: '500',
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
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: -1,
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});

export default LanguageSelectorModal;
