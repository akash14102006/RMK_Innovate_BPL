const fs = require('fs');
const filePath = 'src/i18n/locales/allLanguages.ts';
let content = fs.readFileSync(filePath, 'utf8');

const taglineMap = {
  en: "India's Shared Memory for Every Patient, Every Hospital",
  hi: "हर मरीज, हर अस्पताल के लिए भारत की साझा स्मृति",
  bn: "প্রতিটি রোগী ও প্রতিটি হাসপাতালের জন্য ভারতের শেয়ার্ড মেমোরি",
  te: "ప్రతి రోగి, ప్రతి ఆసుపత్రికి భారతదేశం యొక్క భాగస్వామ్య మెమరీ",
  mr: "प्रत्येक रुग्ण, प्रत्येक रुग्णालयासाठी भारताची सामायिक स्मृती",
  ta: "ஒவ்வொரு நோயாளி மற்றும் ஒவ்வொரு மருத்துவமனைக்குமான இந்தியாவின் பகிரப்பட்ட நினைவகம்",
  gu: "દરેક દર્દી, દરેક હોસ્પિટલ માટે ભારતની વિભાજિત મેમરી",
  kn: "ಪ್ರತಿಯೊಬ್ಬ ರೋಗಿ, ಪ್ರತಿಯೊಂದು ಆಸ್ಪತ್ರೆಗೆ ಭಾರತದ ಹಂಚಿಕೆಯ ಮೆಮೊರಿ",
  ml: "ഓരോ രോഗിക്കും ഓരോ ആശുപത്രിക്കും ഇന്ത്യയുടെ പങ്കിട്ട മെമ്മറി",
  pa: "ਹਰ ਮਰੀਜ਼, ਹਰ ਹਸਪਤਾਲ ਲਈ ਭਾਰਤ ਦੀ ਸਾਂਝੀ ਯਾਦ",
  or: "ପ୍ରତ୍ୟେକ ରୋଗୀ ଏବଂ ପ୍ରତ୍ୟେକ ହସପିଟାଲ୍ ପାଇଁ ଭାରତର ସାଝା ସ୍ମୃତି",
  as: "প্ৰত্যেক ৰোগী আৰু প্ৰত্যেক হাস্পতালৰ বাবে ভাৰতৰ অংশীদাৰী স্মৃতি",
  mai: "हर मरीज, हर अस्पताल के लेल भारतक साझा स्मृति",
  sat: "ᱡᱚᱛᱚ ᱨᱩᱜᱤ ᱟᱨ ᱡᱚᱛᱚ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱞᱟᱹᱜᱤᱫ ᱵᱷᱟᱨᱚᱛ ᱨᱮᱱᱟᱜ ᱥᱟ shared ᱢᱮᱢᱚᱨᱤ",
  ks: "پرتھ بيمارس ت ہسپتالس باپتھ ہندوستانچ شریک یادداشت",
  ne: "हरेक बिरामी र हरेक अस्पतालका लागि भारतको साझा स्मृति",
  sd: "هر مريض ۽ هر بهتال لاءِ भारत جي شيئر ٿيل يادداشت",
  kok: "दर एका दुयेंती आनी हॉस्पिटला खातीर भारताची सामायिकी यादगिरी",
  dog: "हर मरीज ते हर अस्पताल आस्तै भारत दी सांझी याद",
  mni: "অনাবা খুদিংমক অমসুং হোস্পিটাল খুদিংমক্কীদমক ভারতকী শেয়ার তৌরবা মেমোরী",
  ur: "ہر مریض اور ہر ہسپتال کے لیے بھارت کی مشترکہ یادداشت",
  bh: "हर मरीज, हर अस्पताल खातिर भारत के साझा समृति",
  en_IN: "India's Shared Memory for Every Patient, Every Hospital"
};

// First remove any existing tagline lines to avoid duplicates
content = content.replace(/\s*tagline:\s*['"].*?['"],?/g, '');

// Now inject tagline into common object for each language
Object.keys(taglineMap).forEach((lang) => {
  const taglineStr = taglineMap[lang].replace(/'/g, "\\'");
  const regex = new RegExp(`(${lang}:\\s*{\\s*common:\\s*{)`, 'g');
  if (regex.test(content)) {
    content = content.replace(regex, `$1\n      tagline: '${taglineStr}',`);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully cleaned and injected tagline into allLanguages.ts');
