const fs = require('fs');
const filePath = 'src/i18n/locales/allLanguages.ts';
let content = fs.readFileSync(filePath, 'utf8');

const termsDict = {
  title: 'Terms & Conditions',
  subtitle: 'Please read our Terms & Conditions before activating your account',
  section1Title: 'Shared Health Memory Network',
  section1Body: 'Bharat PulseLink provides a secure patient-controlled memory network. You maintain full ownership of your records across all hospitals.',
  section2Title: 'Patient Consent & Access Control',
  section2Body: 'You determine which doctors and healthcare institutions can access your medical records and for what duration.',
  section3Title: 'Data Security & Encryption',
  section3Body: 'All health records are protected using enterprise-grade encryption both in transit and at rest.',
  versionInfo: 'Terms Version {{version}} • Effective August 2026',
  checkboxLabel: 'I have read and agree to the Terms & Conditions'
};

const privacyDict = {
  title: 'Privacy Policy',
  subtitle: 'Your privacy and health data protection are fundamental to our platform',
  section1Title: 'Healthcare Care Continuity',
  section1Body: 'We process health records solely to enable seamless care continuity across authorized hospitals and clinics.',
  section2Title: 'No Data Monetization Policy',
  section2Body: 'Your medical records and personal identity are never sold, rented, or monetized under any circumstances.',
  section3Title: 'Encryption & Sovereign Storage',
  section3Body: 'Health data is stored securely adhering to strict data sovereignty and encryption standards.',
  versionInfo: 'Privacy Policy Version {{version}} • Effective August 2026',
  requiredConsentTitle: 'Healthcare Data Continuity',
  requiredConsentDesc: 'Enable encrypted record access across authorized healthcare providers',
  optionalConsentTitle: 'Anonymized Quality Insights',
  optionalConsentDesc: 'Help improve healthcare service delivery through anonymized insights',
  acceptAction: 'Accept & Continue'
};

const biometricDict = {
  title: 'Local Device Unlock',
  subtitle: 'Use your device biometrics for fast and secure local app access',
  noticeText: 'Biometric unlock protects your app locally. It does not replace your account credentials.',
  enableAction: 'Enable Biometric Unlock',
  skipAction: 'Skip for Now'
};

const pinDict = {
  createTitle: 'Create Security PIN',
  createSubtitle: 'Set a 4-digit local security PIN to protect app access',
  confirmTitle: 'Confirm Security PIN',
  confirmSubtitle: 'Re-enter your 4-digit PIN to confirm',
  mismatchError: 'PINs do not match. Please try again.',
  saveError: 'Failed to save security PIN. Please try again.'
};

const lockDict = {
  title: 'App Locked',
  subtitle: 'Enter your 4-digit Security PIN to continue',
  incorrectPin: 'Incorrect Security PIN. Please try again.',
  lockoutMessage: 'Too many failed attempts. Try again in {{seconds}}s.'
};

const snippet = ',\n    terms: ' + JSON.stringify(termsDict, null, 6) +
  ',\n    privacy: ' + JSON.stringify(privacyDict, null, 6) +
  ',\n    biometric: ' + JSON.stringify(biometricDict, null, 6) +
  ',\n    pin: ' + JSON.stringify(pinDict, null, 6) +
  ',\n    lock: ' + JSON.stringify(lockDict, null, 6);

content = content.replace(/accessibilityHero:\s*["']Communication security verification illustration\.["']\s*\}/g, (match) => {
  return match + snippet;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully injected Prompts 16-20 dictionaries into allLanguages.ts');
