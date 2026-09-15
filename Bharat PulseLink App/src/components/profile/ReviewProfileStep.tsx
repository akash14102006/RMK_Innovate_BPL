import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ProfileDraft, ProfileStepId } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface ReviewProfileStepProps {
  draft: ProfileDraft;
  onEditStep: (stepId: ProfileStepId) => void;
}

export const ReviewProfileStep: React.FC<ReviewProfileStepProps> = ({ draft, onEditStep }) => {
  const {
    basic,
    contact,
    identification,
    medicalBasics,
    conditions,
    allergies,
    medications,
    surgicalHistory,
    lifestyle,
    emergencyContact,
    insurance,
    documents,
    vitalRecords,
  } = draft;

  const maskNumber = (val?: string) => {
    if (!val || !val.trim()) return 'Not Provided';
    if (val.length <= 4) return `•••• ${val}`;
    return `•••• ${val.slice(-4)}`;
  };

  const renderStatusBadge = (isComplete: boolean, isRequired = true) => {
    if (isComplete) {
      return (
        <View style={styles.badgeComplete}>
          <Text style={styles.badgeCompleteText}>Complete</Text>
        </View>
      );
    }
    if (isRequired) {
      return (
        <View style={styles.badgeIncomplete}>
          <Text style={styles.badgeIncompleteText}>Needs Attention</Text>
        </View>
      );
    }
    return (
      <View style={styles.badgeOptional}>
        <Text style={styles.badgeOptionalText}>Optional</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>
        Review your portable healthcare profile below. Tap "Edit" to modify any section.
      </Text>

      {/* 1. Basic Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Basic Information</Text>
            {renderStatusBadge(Boolean(basic.fullName && basic.dateOfBirth && basic.gender), true)}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditStep('basic')} accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardItem}>Name: {basic.fullName || 'Not Provided'}</Text>
        <Text style={styles.cardItem}>DOB: {basic.dateOfBirth || 'Not Provided'} • Gender: {basic.gender || 'Not Provided'}</Text>
        <Text style={styles.cardItem}>Nationality: {basic.nationality || 'Not Specified'}</Text>
      </View>

      {/* 2. Contact Details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Contact Details</Text>
            {renderStatusBadge(Boolean(contact.addressLine1 && contact.state && contact.city && contact.pincode), true)}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditStep('contact')} accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardItem}>Primary Mobile: {contact.primaryPhone || 'Verified'}</Text>
        <Text style={styles.cardItem}>Address: {contact.addressLine1 ? `${contact.addressLine1}, ${contact.city}, ${contact.state} - ${contact.pincode}` : 'Not Provided'}</Text>
      </View>

      {/* 3. Identification */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Identification & Blood Group</Text>
            {renderStatusBadge(Boolean(identification.bloodGroup || identification.aadhaarNumberMasked), false)}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditStep('identification')} accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardItem}>Blood Group: {identification.bloodGroup || 'Not Specified'}</Text>
        <Text style={styles.cardItem}>Aadhaar: {maskNumber(identification.aadhaarNumberMasked)} • PAN: {maskNumber(identification.panNumberMasked)}</Text>
      </View>

      {/* 4. Medical Basics */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Medical Basics</Text>
            {renderStatusBadge(Boolean(medicalBasics.heightCm || medicalBasics.weightKg), false)}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditStep('medicalBasics')} accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardItem}>Height: {medicalBasics.heightCm ? `${medicalBasics.heightCm} cm` : '--'} • Weight: {medicalBasics.weightKg ? `${medicalBasics.weightKg} kg` : '--'}</Text>
        <Text style={styles.cardItem}>Blood Pressure: {medicalBasics.bpSystolic && medicalBasics.bpDiastolic ? `${medicalBasics.bpSystolic}/${medicalBasics.bpDiastolic} mmHg` : '--'}</Text>
      </View>

      {/* 5. Health Conditions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Health Conditions</Text>
            {renderStatusBadge(true, false)}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditStep('conditions')} accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardItem}>
          Reported: {[
            conditions.hasDiabetes && 'Diabetes',
            conditions.hasHypertension && 'Hypertension',
            conditions.hasAsthma && 'Asthma',
            conditions.hasThyroid && 'Thyroid',
            conditions.hasHeartDisease && 'Heart Disease',
            conditions.otherConditionEnabled && (conditions.otherConditionDetails || 'Other'),
          ].filter(Boolean).join(', ') || 'None reported / Unknown'}
        </Text>
      </View>

      {/* 6. Allergies */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Allergies & Sensitivities</Text>
            {renderStatusBadge(true, false)}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditStep('allergies')} accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardItem}>
          Sensitivities: {[
            allergies.hasPollen && 'Pollen',
            allergies.hasDust && 'Dust',
            allergies.hasPeanuts && 'Peanuts',
            allergies.hasMedications && 'Medications',
            allergies.hasSeafood && 'Seafood',
            allergies.otherAllergyEnabled && (allergies.otherAllergyDetails || 'Other'),
          ].filter(Boolean).join(', ') || 'No known allergies reported'}
        </Text>
      </View>

      {/* 7. Medications & Surgical History */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Medications & History</Text>
            {renderStatusBadge(true, false)}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditStep('medications')} accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardItem}>Medications ({medications.length}): {medications.map((m) => m.name).join(', ') || 'None'}</Text>
        <Text style={styles.cardItem}>Surgeries ({surgicalHistory.length}): {surgicalHistory.map((s) => s.procedureName).join(', ') || 'None'}</Text>
      </View>

      {/* 8. Emergency Contact */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Emergency Contact</Text>
            {renderStatusBadge(Boolean(emergencyContact.contactName && emergencyContact.relationship && emergencyContact.primaryPhone), true)}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditStep('emergencyContact')} accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardItem}>Name: {emergencyContact.contactName || 'Not Provided'} ({emergencyContact.relationship || '--'})</Text>
        <Text style={styles.cardItem}>Phone: {emergencyContact.primaryPhone || 'Not Provided'}</Text>
      </View>

      {/* 9. Insurance Details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Insurance Details</Text>
            {renderStatusBadge(Boolean(insurance.hasInsurance), false)}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditStep('insurance')} accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardItem}>{insurance.hasInsurance ? `Provider: ${insurance.providerName || 'Active Insurance'} • Policy: ${insurance.policyNumberMasked || '--'}` : 'No active policy declared'}</Text>
      </View>

      {/* 10. Documents & Diagnostic Tests */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Documents & Diagnostic Records</Text>
            {renderStatusBadge(true, false)}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditStep('documents')} accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardItem}>Attached Documents: {documents.length} files in secure vault</Text>
        <Text style={styles.cardItem}>Diagnostic Records: {vitalRecords.length} records logged</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  instructions: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  card: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badgeComplete: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeCompleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  badgeIncomplete: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeIncompleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },
  badgeOptional: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeOptionalText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  editBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
  },
  editBtnText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  cardItem: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default ReviewProfileStep;
