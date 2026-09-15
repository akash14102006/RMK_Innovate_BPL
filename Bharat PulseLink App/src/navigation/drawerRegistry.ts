export type DrawerItemId =
  | 'home'
  | 'hospitals'
  | 'scan'
  | 'records'
  | 'medications'
  | 'appointments'
  | 'alerts'
  | 'profile'
  | 'support'
  | 'logout';

export type DrawerSection = 'OVERVIEW' | 'CARE' | 'HEALTH' | 'ACCOUNT' | 'SUPPORT' | 'SESSION';

export interface DrawerItemConfig {
  id: DrawerItemId;
  title: string;
  subtitle: string;
  section: DrawerSection;
  requiresAuth: boolean;
  requiresProfile?: boolean;
  hasBadge?: boolean;
}

export const DRAWER_NAV_ITEMS: DrawerItemConfig[] = [
  {
    id: 'home',
    title: 'Home',
    subtitle: 'Dashboard Overview',
    section: 'OVERVIEW',
    requiresAuth: true,
  },
  {
    id: 'hospitals',
    title: 'Hospitals',
    subtitle: 'Find & Book Hospital',
    section: 'CARE',
    requiresAuth: true,
  },
  {
    id: 'scan',
    title: 'Scan at Hospital',
    subtitle: 'QR Scan & Check-In',
    section: 'CARE',
    requiresAuth: true,
  },
  {
    id: 'records',
    title: 'Health Records',
    subtitle: 'Reports & History',
    section: 'HEALTH',
    requiresAuth: true,
  },
  {
    id: 'medications',
    title: 'Medications',
    subtitle: 'Your Medicines',
    section: 'HEALTH',
    requiresAuth: true,
  },
  {
    id: 'appointments',
    title: 'Appointments',
    subtitle: 'Your Bookings',
    section: 'CARE',
    requiresAuth: true,
  },
  {
    id: 'alerts',
    title: 'Alerts',
    subtitle: 'Health Alerts & Reminders',
    section: 'HEALTH',
    requiresAuth: true,
    hasBadge: true,
  },
  {
    id: 'profile',
    title: 'Profile',
    subtitle: 'My Profile & Settings',
    section: 'ACCOUNT',
    requiresAuth: true,
  },
  {
    id: 'support',
    title: 'Help & Support',
    subtitle: 'Support Center',
    section: 'SUPPORT',
    requiresAuth: false,
  },
  {
    id: 'logout',
    title: 'Logout',
    subtitle: 'Sign Out',
    section: 'SESSION',
    requiresAuth: true,
  },
];
