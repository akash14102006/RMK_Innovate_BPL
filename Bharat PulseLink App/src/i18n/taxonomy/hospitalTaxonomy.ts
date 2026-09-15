/**
 * Bharat PulseLink — Healthcare Controlled Taxonomy Architecture
 *
 * Implements Section 16 & 17:
 * - Stable canonical semantic IDs for specialties, facility types, and care types.
 * - Database and API objects continue storing raw canonical codes (e.g. CARDIOLOGY, GOVERNMENT).
 * - Localization layer dynamically resolves human-facing labels in English, Tamil, Hindi, etc.
 * - Never overwrites canonical database fields with translated strings.
 */

import { getLanguageDescriptor } from '../languages';

export interface TaxonomyEntry {
  code: string;
  labels: Record<string, string>; // localeCode or languageCode -> localized label
}

export const SPECIALTY_TAXONOMY: Record<string, TaxonomyEntry> = {
  CARDIOLOGY: {
    code: 'CARDIOLOGY',
    labels: {
      'en-IN': 'Cardiology',
      'hi-IN': 'हृदय रोग विशेषज्ञता',
      'ta-IN': 'இதயவியல்',
      'te-IN': 'కార్డియాలజీ',
      'bn-IN': 'হৃদরোগ বিশেষজ্ঞ',
      'mr-IN': 'हृदयरोगशास्त्र',
      'gu-IN': 'કાર્ડિયોલોજી',
      'kn-IN': 'ಹೃದ್ರೋಗಶಾಸ್ತ್ರ',
      'ml-IN': 'കാർഡിയോളജി',
      'ur-IN': 'امراض قلب',
    },
  },
  NEUROLOGY: {
    code: 'NEUROLOGY',
    labels: {
      'en-IN': 'Neurology',
      'hi-IN': 'तंत्रिका विज्ञान',
      'ta-IN': 'நரம்பியல்',
      'te-IN': 'న్యూరాలజీ',
      'bn-IN': 'স্নায়ুবিজ্ঞান',
      'mr-IN': 'मज्जासंस्थाशास्त्र',
      'gu-IN': 'ન્યુરોલોજી',
      'kn-IN': 'ನರವಿಜ್ಞಾನ',
      'ml-IN': 'ന്യൂറോളജി',
      'ur-IN': 'علم اعصاب',
    },
  },
  ORTHOPEDICS: {
    code: 'ORTHOPEDICS',
    labels: {
      'en-IN': 'Orthopedics',
      'hi-IN': 'अस्थि रोग विशेषज्ञता',
      'ta-IN': 'எலும்பியல்',
      'te-IN': 'ఆర్థోపెడిక్స్',
      'bn-IN': 'অর্থোপেডিকস',
      'mr-IN': 'अस्थिव्यंगोपचार',
      'gu-IN': 'ઓર્થોપેડિક્સ',
      'kn-IN': 'ಮೂಳೆಶಾಸ್ತ್ರ',
      'ml-IN': 'ഓർത്തോപീഡിക്സ്',
      'ur-IN': 'ہڈیوں کا علاج',
    },
  },
  PEDIATRICS: {
    code: 'PEDIATRICS',
    labels: {
      'en-IN': 'Pediatrics',
      'hi-IN': 'बाल रोग विशेषज्ञता',
      'ta-IN': 'குழந்தை நலம்',
      'te-IN': 'పీడియాట్రిక్స్',
      'bn-IN': 'শিশুচিকিৎসা',
      'mr-IN': 'बालरोगशास्त्र',
      'gu-IN': 'બાળરોગશાસ્ત્ર',
      'kn-IN': 'ಮಕ್ಕಳ ತಜ್ಞ',
      'ml-IN': 'പീഡിയാട്രിക്സ്',
      'ur-IN': 'اطفال کا شعبہ',
    },
  },
  ONCOLOGY: {
    code: 'ONCOLOGY',
    labels: {
      'en-IN': 'Oncology',
      'hi-IN': 'कैंसर रोग विशेषज्ञता',
      'ta-IN': 'புற்றுநோயியல்',
      'te-IN': 'ఆంకాలజీ',
      'bn-IN': 'অনকোলজি',
      'mr-IN': 'कर्करोगशास्त्र',
      'gu-IN': 'ઓન્કોલોજી',
      'kn-IN': 'ಕ್ಯಾನ್ಸರ್ ತಜ್ಞ',
      'ml-IN': 'ഓങ്കോളജി',
      'ur-IN': 'کینسر کا شعبہ',
    },
  },
  GENERAL_MEDICINE: {
    code: 'GENERAL_MEDICINE',
    labels: {
      'en-IN': 'General Medicine',
      'hi-IN': 'सामान्य चिकित्सा',
      'ta-IN': 'பொது மருத்துவம்',
      'te-IN': 'జనరల్ మెడిసిన్',
      'bn-IN': 'সাধারণ ওষুধ',
      'mr-IN': 'सामान्य औषधोपचार',
      'gu-IN': 'સામાન્ય દવા',
      'kn-IN': 'ಸಾಮಾನ್ಯ ಔಷಧ',
      'ml-IN': 'ജനറൽ മെഡിസിൻ',
      'ur-IN': 'عمومی ادویات',
    },
  },
};

export const FACILITY_TAXONOMY: Record<string, TaxonomyEntry> = {
  GOVERNMENT: {
    code: 'GOVERNMENT',
    labels: {
      'en-IN': 'Government Hospital',
      'hi-IN': 'सरकारी अस्पताल',
      'ta-IN': 'அரசு மருத்துவமனை',
      'te-IN': 'ప్రభుత్వ ఆసుపత్రి',
      'bn-IN': 'সরকারি হাসপাতাল',
      'mr-IN': 'शासकीय रुग्णालय',
      'gu-IN': 'સરકારી હોસ્પિટલ',
      'kn-IN': 'ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ',
      'ml-IN': 'സർക്കാർ ആശുപത്രി',
      'ur-IN': 'سرکاری ہسپتال',
    },
  },
  PRIVATE_SUPER_SPECIALTY: {
    code: 'PRIVATE_SUPER_SPECIALTY',
    labels: {
      'en-IN': 'Private Super Specialty',
      'hi-IN': 'निजी सुपर स्पेशलिटी',
      'ta-IN': 'தனியார் சூப்பர் ஸ்பெஷாலிட்டி',
      'te-IN': 'ప్రైవేట్ సూపర్ స్పెషాలిటీ',
      'bn-IN': 'বেসরকারি সুপার স্পেশালিটি',
      'mr-IN': 'खाजगी सुपर स्पेशालिटी',
      'gu-IN': 'ખાનગી સુપર સ્પેશિયાલિટી',
      'kn-IN': 'ಖಾಸಗಿ ಸೂಪರ್ ಸ್ಪೆಷಾಲಿಟಿ',
      'ml-IN': 'സ്വകാര്യ സൂപ്പർ സ്പെഷ്യാലിറ്റി',
      'ur-IN': 'نجی سپر اسپیشلٹی',
    },
  },
  EMERGENCY_24X7: {
    code: 'EMERGENCY_24X7',
    labels: {
      'en-IN': '24x7 Emergency Care',
      'hi-IN': '24x7 आपातकालीन सेवा',
      'ta-IN': '24x7 அவசர சிகிச்சை',
      'te-IN': '24x7 అత్యవసర సంరక్షణ',
      'bn-IN': '২৪x৭ জরুরি সেবা',
      'mr-IN': '२४x७ आपत्कालीन सेवा',
      'gu-IN': '૨૪x૭ કટોકટી સંભાળ',
      'kn-IN': '೨೪x೭ ತುರ್ತು ಆರೈಕೆ',
      'ml-IN': '24x7 അടിയന്തര സേവനം',
      'ur-IN': '24 گھنٹے ایمرجنسی نگہداشت',
    },
  },
  ICU: {
    code: 'ICU',
    labels: {
      'en-IN': 'Intensive Care Unit (ICU)',
      'hi-IN': 'गहन चिकित्सा इकाई (ICU)',
      'ta-IN': 'தீவிர சிகிச்சைப் பிரிவு (ICU)',
      'te-IN': 'తీవ్ర సంరక్షణ విభాగం (ICU)',
      'bn-IN': 'নিবিড় পরিচর্যা কেন্দ্র (ICU)',
      'mr-IN': 'अतिदक्षता विभाग (ICU)',
      'gu-IN': 'તીવ્ર સંભાળ એકમ (ICU)',
      'kn-IN': 'ತೀವ್ರ ನಿಗಾ ಘಟಕ (ICU)',
      'ml-IN': 'തീവ്രപരിചരണ വിഭാഗം (ICU)',
      'ur-IN': 'انتہائی نگہداشت کا یونٹ (ICU)',
    },
  },
  BLOOD_BANK: {
    code: 'BLOOD_BANK',
    labels: {
      'en-IN': '24x7 Blood Bank',
      'hi-IN': '24x7 ब्लड बैंक',
      'ta-IN': '24x7 ரத்த வங்கி',
      'te-IN': '24x7 బ్లడ్ బ్యాంక్',
      'bn-IN': '২৪x৭ ব্লাড ব্যাঙ্ক',
      'mr-IN': '२४x७ रक्तपेढी',
      'gu-IN': '૨૪x૭ બ્લડ બેંક',
      'kn-IN': '೨೪x೭ ರಕ್ತ ನಿಧಿ',
      'ml-IN': '24x7 ബ്ലഡ് ബാങ്ക്',
      'ur-IN': 'بلڈ بینک',
    },
  },
};

/**
 * Returns localized label for a taxonomy code in the requested locale.
 * Never mutates canonical database codes.
 */
export const getLocalizedTaxonomyLabel = (
  code: string,
  localeCode: string = 'en-IN'
): string => {
  if (!code) return '';
  const upperCode = code.trim().toUpperCase();
  const desc = getLanguageDescriptor(localeCode);

  const entry = SPECIALTY_TAXONOMY[upperCode] || FACILITY_TAXONOMY[upperCode];
  if (!entry) {
    // If unknown code, return cleanly formatted fallback
    return code
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  return (
    entry.labels[desc.code] ||
    entry.labels[desc.languageCode] ||
    entry.labels['en-IN'] ||
    entry.labels['en'] ||
    code
  );
};

export default {
  SPECIALTY_TAXONOMY,
  FACILITY_TAXONOMY,
  getLocalizedTaxonomyLabel,
};
