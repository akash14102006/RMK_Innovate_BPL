import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { ProfileDraft, ProfileStepId, PROFILE_STEPS, calculateProfileProgress } from '../../types/profile';
import ProfileDraftService from '../../services/ProfileDraftService';
import ProfileValidationService from '../../services/ProfileValidationService';
import ProfileService from '../../services/ProfileService';
import ProfileShell from '../../components/ProfileShell';

// 16 Step Components
import BasicInfoStep from '../../components/profile/BasicInfoStep';
import ContactDetailsStep from '../../components/profile/ContactDetailsStep';
import IdentificationStep from '../../components/profile/IdentificationStep';
import MedicalBasicsStep from '../../components/profile/MedicalBasicsStep';
import HealthConditionsStep from '../../components/profile/HealthConditionsStep';
import AllergiesStep from '../../components/profile/AllergiesStep';
import MedicationsStep from '../../components/profile/MedicationsStep';
import SurgicalHistoryStep from '../../components/profile/SurgicalHistoryStep';
import LifestyleStep from '../../components/profile/LifestyleStep';
import EmergencyContactStep from '../../components/profile/EmergencyContactStep';
import InsuranceStep from '../../components/profile/InsuranceStep';
import DocumentUploadStep from '../../components/profile/DocumentUploadStep';
import VitalRecordsStep from '../../components/profile/VitalRecordsStep';
import ReviewProfileStep from '../../components/profile/ReviewProfileStep';
import SecurityConsentStep from '../../components/profile/SecurityConsentStep';
import ProfileCompleteStep from '../../components/profile/ProfileCompleteStep';
import { colors } from '../../theme/tokens';

// ProfileStepScreen is mounted in both AuthStack (first-time setup) and
// AppStack (re-entry from Home/HealthSummary). It must NOT depend on either
// stack's type exclusively. We use the generic useNavigation hook so it
// works in both contexts, and CommonActions.reset for cross-stack transitions.
export const ProfileStepScreen: React.FC<{ route?: any }> = ({ route }) => {
  const navigation = useNavigation<any>();
  const targetStepId = route.params?.stepId;
  const initialStepIndex = targetStepId ? PROFILE_STEPS.findIndex((s) => s.stepId === targetStepId) : 0;

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex >= 0 ? initialStepIndex : 0);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeStepConfig = PROFILE_STEPS[currentStepIndex] || PROFILE_STEPS[0];

  // Initialize draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    setIsLoading(true);
    try {
      const loaded = await ProfileDraftService.loadDraft('user_patient_primary');
      setDraft(loaded);
    } catch (e) {
      console.error('[PROFILE] Error initializing draft', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate step before advancing
  const validateCurrentStep = (): boolean => {
    if (!draft) return false;
    setErrors({});
    let res = { isValid: true, errors: {} };

    switch (activeStepConfig.stepId) {
      case 'basic':
        res = ProfileValidationService.validateBasicInfo(draft.basic);
        break;
      case 'contact':
        res = ProfileValidationService.validateContactDetails(draft.contact);
        break;
      case 'identification':
        res = ProfileValidationService.validateIdentification(draft.identification);
        break;
      case 'medicalBasics':
        res = ProfileValidationService.validateMedicalBasics(draft.medicalBasics);
        break;
      case 'emergencyContact':
        res = ProfileValidationService.validateEmergencyContact(draft.emergencyContact);
        break;
      case 'insurance':
        res = ProfileValidationService.validateInsurance(draft.insurance);
        break;
      case 'securityConsent':
        res = ProfileValidationService.validateSecurityConsent(draft.securityConsent);
        break;
      case 'review':
        res = { isValid: true, errors: {} };
        break;
      default:
        res = { isValid: true, errors: {} };
    }

    if (!res.isValid) {
      setErrors(res.errors);
    }
    return res.isValid;
  };

  const navigateToHome = () => {
    // Use CommonActions.reset to navigate to AppStack → Home.
    // This works regardless of whether ProfileStepScreen is mounted inside
    // AuthStack or AppStack. React Navigation resolves the nearest matching
    // screen up the navigator tree when using CommonActions.reset.
    try {
      // If we're already inside AppStack (re-entry from Home), just goBack or
      // navigate directly within the AppStack.
      const parent = navigation.getParent();
      const parentState = parent?.getState();
      const isInAppStack = parentState?.routeNames?.includes('Home');

      if (isInAppStack) {
        // We're inside AppStack — navigate directly
        navigation.navigate('Home');
      } else {
        // We're inside AuthStack — reset root to AppStack → Home
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'AppStack',
                state: {
                  routes: [{ name: 'Home' }],
                },
              },
            ],
          })
        );
      }
    } catch (err) {
      console.warn('[PROFILE] navigateToHome error, using reset fallback:', err);
      // Absolute last-resort: reset the full navigation tree to AppStack Home
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'AppStack', state: { routes: [{ name: 'Home' }] } }],
        })
      );
    }
  };

  // Handle Next / Save action
  const handleNext = async () => {
    if (activeStepConfig.stepId === 'complete') {
      navigateToHome();
      return;
    }

    if (!validateCurrentStep()) return;

    setIsSaving(true);
    try {
      if (draft) {
        // Mark step completed & save encrypted local draft
        await ProfileDraftService.markStepCompleted(activeStepConfig.stepId);
        await ProfileService.syncProfileDraft(draft);

        // If at step 15 (Security Consent), submit final profile to server completion gate
        if (activeStepConfig.stepId === 'securityConsent') {
          try {
            await ProfileService.submitFinalProfile(draft);
          } catch (e) {
            console.warn('[PROFILE] Final profile submit warning:', e);
          }
          await ProfileDraftService.markProfileCompleted();
        }
      }

      // Advance to next step
      if (currentStepIndex < PROFILE_STEPS.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        navigateToHome();
      }
    } catch (err: any) {
      setErrors({ global: err?.message || 'Save failed. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleBuildLater = async () => {
    try {
      if (draft) {
        await ProfileDraftService.saveDraft(draft);
        await ProfileService.syncProfileDraft(draft);
      }
    } catch {}
    navigateToHome();
  };

  const handleEditStep = (targetStepId: ProfileStepId) => {
    const idx = PROFILE_STEPS.findIndex((s) => s.stepId === targetStepId);
    if (idx !== -1) {
      setCurrentStepIndex(idx);
    }
  };

  // Render Step Body
  const renderStepBody = () => {
    if (!draft) return null;

    switch (activeStepConfig.stepId) {
      case 'basic':
        return (
          <BasicInfoStep
            data={draft.basic}
            onChange={(upd) => setDraft({ ...draft, basic: { ...draft.basic, ...upd } })}
            errors={errors}
          />
        );
      case 'contact':
        return (
          <ContactDetailsStep
            data={draft.contact}
            onChange={(upd) => setDraft({ ...draft, contact: { ...draft.contact, ...upd } })}
            errors={errors}
          />
        );
      case 'identification':
        return (
          <IdentificationStep
            data={draft.identification}
            onChange={(upd) => setDraft({ ...draft, identification: { ...draft.identification, ...upd } })}
            errors={errors}
          />
        );
      case 'medicalBasics':
        return (
          <MedicalBasicsStep
            data={draft.medicalBasics}
            onChange={(upd) => setDraft({ ...draft, medicalBasics: { ...draft.medicalBasics, ...upd } })}
            errors={errors}
          />
        );
      case 'conditions':
        return (
          <HealthConditionsStep
            data={draft.conditions}
            onChange={(upd) => setDraft({ ...draft, conditions: { ...draft.conditions, ...upd } })}
          />
        );
      case 'allergies':
        return (
          <AllergiesStep
            data={draft.allergies}
            onChange={(upd) => setDraft({ ...draft, allergies: { ...draft.allergies, ...upd } })}
          />
        );
      case 'medications':
        return (
          <MedicationsStep
            items={draft.medications}
            onChange={(items) => setDraft({ ...draft, medications: items })}
          />
        );
      case 'surgicalHistory':
        return (
          <SurgicalHistoryStep
            items={draft.surgicalHistory}
            onChange={(items) => setDraft({ ...draft, surgicalHistory: items })}
          />
        );
      case 'lifestyle':
        return (
          <LifestyleStep
            data={draft.lifestyle}
            onChange={(upd) => setDraft({ ...draft, lifestyle: { ...draft.lifestyle, ...upd } })}
          />
        );
      case 'emergencyContact':
        return (
          <EmergencyContactStep
            data={draft.emergencyContact}
            onChange={(upd) => setDraft({ ...draft, emergencyContact: { ...draft.emergencyContact, ...upd } })}
            errors={errors}
          />
        );
      case 'insurance':
        return (
          <InsuranceStep
            data={draft.insurance}
            onChange={(upd) => setDraft({ ...draft, insurance: { ...draft.insurance, ...upd } })}
            errors={errors}
          />
        );
      case 'documents':
        return (
          <DocumentUploadStep
            documents={draft.documents}
            onChange={(docs) => setDraft({ ...draft, documents: docs })}
          />
        );
      case 'vitalRecords':
        return (
          <VitalRecordsStep
            records={draft.vitalRecords}
            onChange={(recs) => setDraft({ ...draft, vitalRecords: recs })}
          />
        );
      case 'review':
        return <ReviewProfileStep draft={draft} onEditStep={handleEditStep} />;
      case 'securityConsent':
        return (
          <SecurityConsentStep
            data={draft.securityConsent}
            onChange={(upd) => setDraft({ ...draft, securityConsent: { ...draft.securityConsent, ...upd } })}
            errors={errors}
          />
        );
      case 'complete':
        return <ProfileCompleteStep onGoHome={navigateToHome} />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (activeStepConfig.stepId) {
      case 'basic': return 'Basic Information';
      case 'contact': return 'Contact Details';
      case 'identification': return 'Identification Details';
      case 'medicalBasics': return 'Medical Basics';
      case 'conditions': return 'Health Conditions';
      case 'allergies': return 'Allergies & Sensitivities';
      case 'medications': return 'Current Medications';
      case 'surgicalHistory': return 'Surgical History';
      case 'lifestyle': return 'Lifestyle Habits';
      case 'emergencyContact': return 'Emergency Contact';
      case 'insurance': return 'Insurance Details';
      case 'documents': return 'Document Upload';
      case 'vitalRecords': return 'Vital Records & Tests';
      case 'review': return 'Review Profile';
      case 'securityConsent': return 'Security & Privacy Consent';
      case 'complete': return 'Profile Complete';
      default: return 'Profile Setup';
    }
  };

  const getStepSubtitle = () => {
    switch (activeStepConfig.stepId) {
      case 'basic': return 'Foundational demographic information for care access.';
      case 'contact': return 'Address and contact numbers for hospital continuity.';
      case 'identification': return 'Optional government IDs and blood group for verification.';
      case 'medicalBasics': return 'Physical vitals and baseline measurements provided by you.';
      case 'conditions': return 'Select health conditions for your care summary.';
      case 'allergies': return 'List allergen sensitivities for safe prescription checking.';
      case 'medications': return 'Log current medications to prevent drug interactions.';
      case 'surgicalHistory': return 'Past surgeries and medical procedures.';
      case 'lifestyle': return 'Habits and preferences to help customize care guidance.';
      case 'emergencyContact': return 'Contact details for emergency notifications.';
      case 'insurance': return 'Health insurance provider and policy details.';
      case 'documents': return 'Attach prescriptions, insurance cards, or ID scans.';
      case 'vitalRecords': return 'Log diagnostic test reports and scan dates.';
      case 'review': return 'Verify all profile details before final submission.';
      case 'securityConsent': return 'Review privacy controls and authorize secure health storage.';
      case 'complete': return 'Your portable healthcare profile is active and ready.';
      default: return 'Build your portable health profile.';
    }
  };

  if (isLoading || !draft) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ProfileShell
      stepNumber={activeStepConfig.stepNumber}
      totalSteps={16}
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
      heroIcon={activeStepConfig.heroIcon}
      profileProgressPct={calculateProfileProgress(draft)}
      onBack={currentStepIndex === 15 ? undefined : handleBack}
      onNext={handleNext}
      onLater={handleBuildLater}
      onSkip={activeStepConfig.isOptional ? () => setCurrentStepIndex(currentStepIndex + 1) : undefined}
      isNextLoading={isSaving}
      nextButtonText={activeStepConfig.stepId === 'complete' ? 'Continue to Dashboard →' : activeStepConfig.stepId === 'review' ? 'Confirm Profile →' : 'Continue →'}
    >
      {renderStepBody()}
    </ProfileShell>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

export default ProfileStepScreen;
