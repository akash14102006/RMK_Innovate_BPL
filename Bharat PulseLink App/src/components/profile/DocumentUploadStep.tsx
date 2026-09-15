import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { UploadedDocumentItem } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import SelectDropdownModal, { OptionItem } from '../common/SelectDropdownModal';

export interface DocumentUploadStepProps {
  documents: UploadedDocumentItem[];
  onChange: (updated: UploadedDocumentItem[]) => void;
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({ documents, onChange }) => {
  const [selectedCategory, setSelectedCategory] = useState<UploadedDocumentItem['category']>('PRESCRIPTION');
  const [customDocName, setCustomDocName] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const categoryOptions: OptionItem<UploadedDocumentItem['category']>[] = [
    { label: 'Prescription', value: 'PRESCRIPTION' },
    { label: 'Insurance Card / Policy', value: 'INSURANCE' },
    { label: 'Aadhaar Card', value: 'AADHAAR' },
    { label: 'PAN Card', value: 'PAN' },
    { label: 'Profile Photo', value: 'PROFILE_PHOTO' },
    { label: 'Other Document', value: 'OTHER' },
  ];

  const getCategoryLabel = (type: UploadedDocumentItem['category']) => {
    const found = categoryOptions.find((o) => o.value === type);
    return found ? found.label : 'Select Category';
  };

  const handleSimulatedUpload = () => {
    setUploadError(null);
    setIsUploading(true);

    setTimeout(() => {
      setIsUploading(false);
      const title = selectedCategory === 'OTHER' && customDocName.trim()
        ? customDocName.trim()
        : getCategoryLabel(selectedCategory);

      const newDoc: UploadedDocumentItem = {
        id: `doc_${Date.now()}`,
        category: selectedCategory,
        fileName: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
        fileSizeBytes: 1468000,
        mimeType: 'application/pdf',
        secureReferenceUri: `sec_doc_${Math.random().toString(36).slice(2, 9)}`,
        uploadedAt: new Date().toISOString(),
      };

      onChange([...documents, newDoc]);
      setCustomDocName('');
    }, 600);
  };

  const handleRemove = (id: string) => {
    onChange(documents.filter((item) => item.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>
        Upload medical records, prescriptions, or identification scans to your secure health vault:
      </Text>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <View style={styles.listContainer}>
          <Text style={styles.subHeader}>Uploaded Documents ({documents.length}):</Text>
          {documents.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docIcon}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={colors.primary} strokeWidth={2} />
                  <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.docName} numberOfLines={1}>
                  {doc.fileName}
                </Text>
                <Text style={styles.docDetails}>
                  {getCategoryLabel(doc.category)} • {(doc.fileSizeBytes / 1000000).toFixed(1)} MB
                </Text>
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemove(doc.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${doc.fileName}`}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke={colors.danger} strokeWidth={2.2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add Document Upload Card */}
      <View style={styles.uploadCard}>
        <Text style={styles.uploadTitle}>Attach New Document</Text>

        {/* Category Dropdown Modal Trigger */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Document Category</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setIsCategoryModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select Document Category"
          >
            <Text style={styles.pickerTriggerText}>{getCategoryLabel(selectedCategory)}</Text>
            <Text style={styles.pickerIcon}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* If Other Category */}
        {selectedCategory === 'OTHER' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Enter Document Name</Text>
            <TextInput
              style={styles.input}
              value={customDocName}
              onChangeText={setCustomDocName}
              placeholder="e.g. Immunization Certificate / Discharge Summary"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Custom Document Name"
            />
          </View>
        )}

        {uploadError && <Text style={styles.errorText}>{uploadError}</Text>}

        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={handleSimulatedUpload}
          disabled={isUploading}
          accessibilityRole="button"
          accessibilityLabel="Upload File"
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.uploadBtnRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.uploadButtonText}>Select & Encrypt File</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.vaultNote}>
          Supported formats: PDF, JPG, PNG (Max 15MB). Stored with 256-bit client-side encryption.
        </Text>
      </View>

      {/* Category Modal */}
      <SelectDropdownModal
        visible={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Select Document Category"
        options={categoryOptions}
        selectedValue={selectedCategory}
        onSelect={(cat) => setSelectedCategory(cat)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  listContainer: {
    gap: spacing.xs,
  },
  subHeader: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  docName: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  docDetails: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: spacing.xs,
  },
  uploadCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(15, 118, 110, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.15)',
  },
  uploadTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  pickerTrigger: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  pickerTriggerText: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pickerIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  uploadButton: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  uploadButtonDisabled: {
    backgroundColor: colors.border,
  },
  uploadBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  vaultNote: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  errorText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.danger,
  },
});

export default DocumentUploadStep;
