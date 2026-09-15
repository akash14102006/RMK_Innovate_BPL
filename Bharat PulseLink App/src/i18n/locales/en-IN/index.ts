import common from './common';
import navigation from './navigation';
import auth from './auth';
import onboarding from './onboarding';
import language from './language';
import home from './home';
import hospitals from './hospitals';
import hospitalDetails from './hospitalDetails';
import hospitalRoute from './hospitalRoute';
import checkin from './checkin';
import qr from './qr';
import appointments from './appointments';
import records from './records';
import profile from './profile';
import settings from './settings';
import notifications from './notifications';
import errors from './errors';
import validation from './validation';
import consent from './consent';
import security from './security';
import accessibility from './accessibility';
import location from './location';
import network from './network';
import offline from './offline';
import emergency from './emergency';

export const enIN = {
  common,
  navigation,
  auth,
  onboarding,
  language,
  home,
  hospitals,
  hospitalDetails,
  hospitalRoute,
  checkin,
  qr,
  appointments,
  records,
  profile,
  settings,
  notifications,
  errors,
  validation,
  consent,
  security,
  accessibility,
  location,
  network,
  offline,
  emergency,

  // Backward compatibility aliases for existing UI screens
  languageSelection: language,
  map: hospitals,
  filters: hospitals,
  search: hospitals,
  doctorAvailability: appointments,
  serviceAvailability: hospitals,
  appointmentSelection: appointments,
  bookingReview: appointments,
  bookingConfirmation: appointments,
  scanEntry: qr,
  qrScanner: qr,
  mySecureQR: qr,
  consentBeforeSharing: consent,
  secureDataExchange: security,
  scanSuccess: qr,
  scanFailure: qr,
  myCheckIn: checkin,
  liveCheckInStatus: checkin,
  healthRecords: records,
  terms: consent,
  privacy: consent,
  biometric: security,
  pin: security,
  lock: security,
  otp: auth,
};

export default enIN;
