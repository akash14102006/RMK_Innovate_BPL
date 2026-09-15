const fs = require('fs');
const filePath = 'src/i18n/locales/allLanguages.ts';

const enCommon = {
  appName: 'Bharat PulseLink',
  tagline: "India's Shared Memory for Every Patient, Every Hospital",
  loading: 'Loading...',
  error: 'An unexpected error occurred.',
  retry: 'Retry',
  cancel: 'Cancel',
  confirm: 'Confirm',
  save: 'Save',
  back: 'Back',
  next: 'Next',
  done: 'Done',
  offline: 'You are currently offline',
  skip: 'Skip',
  continue: 'Continue',
  getStarted: 'Get Started',
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
};

const enOnboarding = {
  common: {
    skip: 'Skip',
    continue: 'Continue',
    getStarted: 'Get Started',
    back: 'Back',
    stepProgress: 'Step {{current}} of {{total}}',
  },
  screen1: {
    eyebrow: 'PORTABLE HEALTH IDENTITY',
    title: 'Your health. Your continuity.',
    description: 'Keep your health journey connected, wherever care takes you.',
    accessibilityHero: 'Visual illustration of a patient health timeline connecting medical records across hospitals.',
  },
  screen2: {
    eyebrow: 'HOSPITAL DISCOVERY',
    title: 'Find care near you.',
    description: 'Discover nearby hospitals and available healthcare services.',
    accessibilityHero: 'Visual illustration showing map markers and healthcare facilities nearby.',
  },
  screen3: {
    eyebrow: 'PATIENT CONTROL',
    title: 'Share securely. Stay in control.',
    description: 'Give healthcare providers access only to the information they need.',
    accessibilityHero: 'Visual illustration showing patient-controlled encrypted record sharing with a healthcare provider.',
  },
  screen4: {
    eyebrow: 'CONNECTED CARE',
    title: 'Your health journey, connected.',
    description: 'From finding care to keeping your records together.',
    accessibilityHero: 'Visual illustration showing a complete connected health journey.',
  },
};

const enLanguageSelection = {
  eyebrow: 'PREFERRED LANGUAGE',
  title: 'Choose your language',
  subtitle: 'Select the language you prefer for your healthcare journey',
  continue: 'Continue',
  accessibilityHero: 'Visual emblem depicting global Indian language connectivity.',
  accessibilityOption: 'Option {{name}}',
  accessibilityOptionSelected: 'Selected option {{name}}',
};

const enAuth = {
  login: 'Log In',
  logout: 'Log Out',
  sessionExpired: 'Your session has expired. Please log in again.',
  welcomeTitle: 'Welcome to Bharat PulseLink',
  continueWithGoogle: 'Continue with Google',
  continueWithWhatsApp: 'Continue with WhatsApp',
  orDivider: 'OR',
  termsPrefix: 'By continuing, you agree to our',
  phoneModalHeader: 'Continue with WhatsApp',
  phoneModalSubtitle: 'Enter your mobile number to receive a secure verification code.',
  phoneLabel: 'Mobile Number',
  phonePlaceholder: '98765 43210',
  submitButton: 'Continue',
  cancelButton: 'Cancel',
  enterPhonePrompt: 'Please enter your 10-digit mobile number',
  invalidPhone: 'Please enter a valid 10-digit Indian mobile number',
  getOtp: 'Get OTP',
  providerBlocked: 'This authentication provider is currently unconfigured or blocked.',
  errorOccurred: 'Authentication failed. Please try again.',
};

const enOtp = {
  title: 'OTP Verification',
  sentInstruction: 'Enter 6-digit code sent to',
  changeNumber: 'Change Number',
  resendIn: 'Resend code in',
  resendCode: 'Resend Code',
  verifyAction: 'Verify & Continue',
  invalidCode: 'Incorrect verification code. Please try again.',
  verificationFailed: 'Verification failed. Please try again.',
  resendFailed: 'Unable to resend code right now.',
  accessibilityHero: 'Communication security verification illustration.',
};

const enTerms = {
  title: 'Terms & Conditions',
  subtitle: 'Please review the terms that govern your use of Bharat PulseLink.',
  readFull: 'Read full Terms →',
  section1Title: 'Shared Health Memory Network',
  section1Body: 'Bharat PulseLink provides a secure patient-controlled memory network. You maintain full ownership of your records across all hospitals.',
  section2Title: 'Patient Consent & Access Control',
  section2Body: 'You determine which doctors and healthcare institutions can access your medical records and for what duration.',
  section3Title: 'Data Security & Encryption',
  section3Body: 'All health records are protected using enterprise-grade encryption both in transit and at rest.',
  versionInfo: 'Version {{version}} • Effective August 2026',
  checkboxLabel: 'I agree to the Terms & Conditions',
  continueAction: 'Agree & Continue',
};

const enPrivacy = {
  title: 'Your Privacy Matters',
  subtitle: 'Understand how Bharat PulseLink handles your information.',
  cardCollectTitle: 'What we collect',
  cardCollectBody: 'Encrypted health records, hospital visit logs, and account identity details.',
  cardUseTitle: 'Why we use it',
  cardUseBody: 'Solely to enable seamless care continuity across your authorized hospitals.',
  cardProtectTitle: 'How it is protected',
  cardProtectBody: 'Protected using 256-bit enterprise encryption in transit and at rest.',
  cardControlsTitle: 'Your privacy choices',
  cardControlsBody: 'Grant, manage, or revoke doctor access to your records at any time.',
  readFull: 'Read full Privacy Policy →',
  versionInfo: 'Version {{version}} • Effective August 2026',
  acceptAction: 'Continue',
};

const enBiometric = {
  title: 'Unlock faster. Stay protected.',
  subtitle: 'Use your device biometrics to unlock Bharat PulseLink quickly and securely.',
  benefitFast: 'Fast',
  benefitPrivate: 'Private',
  benefitDevice: 'Device-based',
  enableAction: 'Enable Biometrics',
  skipAction: 'Maybe Later',
  notEnrolled: 'Biometrics supported, but no biometrics are enrolled in your device settings.',
  unsupported: 'Biometric hardware is not available on this device.',
  lockout: 'Too many failed attempts. Biometric unlock is temporarily locked out.',
};

const enPin = {
  title: 'Protect your app',
  subtitle: 'Create an optional Security PIN for local access to Bharat PulseLink.',
  createTitle: 'Create Security PIN',
  createSubtitle: 'Enter a 6-digit PIN to protect app access locally',
  confirmTitle: 'Confirm Security PIN',
  confirmSubtitle: 'Re-enter your 6-digit PIN to confirm',
  weakPinNotice: 'Notice: This PIN is easily guessable. Consider a stronger PIN.',
  mismatchError: 'PINs do not match. Please re-enter.',
  continueAction: 'Continue',
  skipAction: 'Skip for now',
};

const enLock = {
  title: 'App Locked',
  subtitle: 'Enter your Security PIN to continue',
  incorrectPin: 'Incorrect Security PIN. Please try again.',
  lockoutMessage: 'Too many failed attempts. Try again in {{seconds}}s.',
};

const baseLangObj = {
  common: enCommon,
  onboarding: enOnboarding,
  languageSelection: enLanguageSelection,
  auth: enAuth,
  otp: enOtp,
  terms: enTerms,
  privacy: enPrivacy,
  biometric: enBiometric,
  pin: enPin,
  lock: enLock,
};

const overrides = {
  hi: {
    languageSelection: { ...enLanguageSelection, title: 'अपनी भाषा चुनें' },
    common: { ...enCommon, continue: 'आगे बढ़ें' },
  },
  ta: {
    languageSelection: { ...enLanguageSelection, title: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்' },
    common: { ...enCommon, continue: 'தொடரவும்' },
  },
  te: {
    languageSelection: { ...enLanguageSelection, title: 'మీ భాషను ఎంచుకోండి' },
    common: { ...enCommon, continue: 'కొనసాగించండి' },
  },
  bn: {
    languageSelection: { ...enLanguageSelection, title: 'আপনার ভাষা নির্বাচন করুন' },
    common: { ...enCommon, continue: 'এগিয়ে যান' },
  },
  ml: {
    languageSelection: { ...enLanguageSelection, title: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക' },
    common: { ...enCommon, continue: 'തുടരുക' },
  },
  pa: {
    languageSelection: { ...enLanguageSelection, title: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ' },
    common: { ...enCommon, continue: 'ਅੱਗੇ ਵਧੋ' },
  },
  sd: {
    languageSelection: {
      ...enLanguageSelection,
      title: 'پنهنجي ٻولي چونڊيو',
      subtitle: 'پنهنجي صحت جي سفر لاءِ پنهنجي پسنديده ٻولي چونڊيو',
    },
    common: { ...enCommon, continue: 'اڳتي وڌو' },
  },
  ur: {
    languageSelection: { ...enLanguageSelection, title: 'اپنی زبان منتخب کریں' },
    common: { ...enCommon, continue: 'آگے بڑھیں' },
  },
};

const codes = [
  'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa',
  'or', 'as', 'brx', 'doi', 'ks', 'kok', 'mai', 'mni', 'ne', 'sa',
  'sat', 'sd', 'ur'
];

const languageResources = {};
codes.forEach((c) => {
  const custom = overrides[c] || {};
  languageResources[c] = {
    ...baseLangObj,
    ...custom,
    common: { ...enCommon, ...(custom.common || {}) },
    languageSelection: { ...enLanguageSelection, ...(custom.languageSelection || {}) },
  };
});

const tsCode = `export const languageResources: Record<string, any> = ${JSON.stringify(languageResources, null, 2)};\nexport default languageResources;\n`;
fs.writeFileSync(filePath, tsCode, 'utf8');
console.log('Successfully built complete allLanguages.ts file matching exact 23 scheduled language codes');
