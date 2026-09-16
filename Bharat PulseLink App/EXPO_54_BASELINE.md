# Bharat PulseLink — Expo SDK 54 Migration Baseline

**Date:** 2026-09-16  
**Repository:** Bharat PulseLink Mobile App  
**Working Directory:** `c:\Users\akash\Downloads\Bharat PulseLink\Bharat PulseLink App`  
**Migration Target:** Expo SDK 57 (Production-Grade Android / EAS)

---

## 1. Environment & Tooling Baseline

- **Node.js Version:** `v24.15.0`
- **npm Version:** `11.6.2`
- **Current Expo SDK:** `54.0.37` (`~54.0.37`)
- **Current React Native:** `0.81.5`
- **Current React:** `19.1.0`
- **Current TypeScript:** `^5.2.2`
- **Current Hermes Engine:** Enabled (`hermesEnabled=true`)
- **Current Architecture:** New Architecture Enabled (`newArchEnabled=true`)
- **Current Android Compile SDK:** Prebuild configured (`ext.compileSdkVersion`)
- **Current Android Target SDK:** Prebuild configured (`ext.targetSdkVersion`)
- **Current Gradle Distribution:** `gradle-8.14.3-bin.zip`
- **Current EAS CLI Requirement:** `>= 22.2.0`
- **Current App Workflow:** Hybrid Expo with Prebuild (`android/` present)

---

## 2. Pre-Migration Dependency Matrix (SDK 54 Baseline)

| Package | SDK 54 Baseline Version | SDK 57 Official Target | Role |
|---|---|---|---|
| `expo` | `~54.0.37` | `~57.0.23` | Core Expo Runtime |
| `react` | `19.1.0` | `19.2.3` | React Framework |
| `react-dom` | `19.1.0` | `19.2.3` | React DOM (Web) |
| `react-native` | `0.81.5` | `0.86.3` | React Native Core |
| `expo-auth-session` | `~7.0.11` | `~57.0.12` | Auth Session / OAuth |
| `expo-camera` | `~17.0.10` | `~57.0.5` | QR & Barcode Camera |
| `expo-crypto` | `~15.0.9` | `~57.0.3` | Cryptographic Primitives |
| `expo-dev-client` | `~6.0.21` | `~57.0.19` | Development Client |
| `expo-document-picker` | `~14.0.8` | `~57.0.2` | Document/Record Picker |
| `expo-haptics` | `~15.0.8` | `~57.0.3` | Tactile Feedback |
| `expo-image-picker` | `~17.0.11` | `~57.0.18` | Medical Image Picker |
| `expo-local-authentication` | `~17.0.9` | `~57.0.3` | Biometrics / PIN Auth |
| `expo-localization` | `~17.0.9` | `~57.0.2` | Multilingual Localization |
| `expo-location` | `~19.0.8` | `~57.0.18` | Emergency Geo Location |
| `expo-secure-store` | `~15.0.8` | `~57.0.4` | Hardware Keystore / Secure Storage |
| `expo-speech` | `~14.0.8` | `~57.0.3` | Accessibility Voice / Speech |
| `expo-web-browser` | `~15.0.11` | `~57.0.3` | In-App Browser Auth |
| `expo-constants` | (transitive) | `~57.0.18` | Manifest & Device Info |
| `expo-file-system` | (transitive) | `~57.0.7` | Offline Storage & Cache |
| `expo-font` | (transitive) | `~57.0.4` | Custom Typography |
| `lottie-react-native` | `~7.3.1` | `~7.3.8` | UI Micro-animations |
| `react-native-safe-area-context` | `~5.6.0` | `~5.7.0` | SafeArea Insets |
| `react-native-screens` | `~4.16.0` | `~4.26.0` | Native Screen Navigation |
| `react-native-svg` | `15.12.1` | `15.15.4` | Vector & QR Graphics |
| `react-native-maps` | `1.20.1` | `1.27.2` | Hospital Mapping |
| `react-native-qrcode-svg` | `^6.3.21` | `^6.3.24` | Bharat PulseLink QR Code |
| `react-native-web` | `^0.21.0` | `~0.21.0` | Web Compatibility |
| `@types/react` | `~19.1.10` | `~19.2.0` | TypeScript React Types |
| `typescript` | `^5.2.2` | `^5.4.0` or `^5.7.0` | Type Checking |

---

## 3. Critical Regression Targets

1. **Authentication:** Google OAuth, Descope Token Flow, WhatsApp OTP, MiniMoth Verification.
2. **QR Protocol:** `bplqr://` (Online Secure QR) & `bploff://` (Offline Secure QR) generation, signing, and scanning.
3. **Security:** Hardware Keystore / SecureStore, AES-GCM decryption/encryption, SHA-256 HMAC.
4. **Offline Architecture:** Offline Key Registry, local replay protection cache.
5. **EAS Build & Android Native:** Preview profile producing clean, installable `.apk`.
