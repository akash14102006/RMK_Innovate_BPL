/**
 * Real-Time Alert Service
 * Generates live hospital management alerts based on current data
 */

import { getNextMajorFestival, getFestivalByDate, INDIAN_FESTIVALS_2026 } from './festivalService';
import { AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';

export interface RealTimeAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  timestampRaw: Date;
  status: 'active' | 'resolved';
  icon: any;
  category: 'patient' | 'aqi' | 'epidemic' | 'festival' | 'inventory' | 'staffing';
}

/**
 * Generate real-time alerts based on current conditions
 */
export function generateRealTimeAlerts(): RealTimeAlert[] {
  const alerts: RealTimeAlert[] = [];
  const now = new Date();

  // 1. Festival-based alerts
  const nextFestival = getNextMajorFestival();
  if (nextFestival) {
    const festivalDate = new Date(nextFestival.date);
    const daysUntil = Math.ceil((festivalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 7 && daysUntil > 0) {
      alerts.push({
        id: `festival-${nextFestival.name}`,
        type: 'critical',
        title: `High Patient Surge Predicted - ${nextFestival.name}`,
        message: `Expected ${nextFestival.surge} increase in patient load in ${daysUntil} days (${nextFestival.date.split('-').slice(1).join('/')}). Deploy additional staff and prepare emergency supplies.`,
        timestamp: `${daysUntil} days away`,
        timestampRaw: festivalDate,
        status: 'active',
        icon: AlertTriangle,
        category: 'festival',
      });
    }
  }

  // 2. Current date festival alert
  const todayFestival = getFestivalByDate(now);
  if (todayFestival) {
    alerts.push({
      id: `festival-today-${todayFestival.name}`,
      type: 'critical',
      title: `${todayFestival.name} - Active Today`,
      message: `Current festival in progress. ${todayFestival.surge} surge in patient load expected. All emergency protocols active.`,
      timestamp: 'Active Now',
      timestampRaw: now,
      status: 'active',
      icon: AlertTriangle,
      category: 'festival',
    });
  }

  // 3. AQI-based alert (real-time simulation)
  const currentHour = now.getHours();
  if (currentHour >= 6 && currentHour <= 10) {
    alerts.push({
      id: 'aqi-morning-peak',
      type: 'warning',
      title: 'AQI Level Rising - Morning Peak',
      message: 'Air quality deteriorating during morning hours. Prepare for respiratory case surge in next 2-4 hours.',
      timestamp: getRelativeTime(new Date(now.getTime() - 30 * 60 * 1000)),
      timestampRaw: new Date(now.getTime() - 30 * 60 * 1000),
      status: 'active',
      icon: AlertTriangle,
      category: 'aqi',
    });
  }

  // 4. Upcoming festivals in next 14 days
  const upcomingFestivals = INDIAN_FESTIVALS_2026.filter(f => {
    const festDate = new Date(f.date);
    const diff = festDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 14 && f.level === 'moderate';
  });

  upcomingFestivals.forEach(festival => {
    const festivalDate = new Date(festival.date);
    const daysUntil = Math.ceil((festivalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    alerts.push({
      id: `festival-prep-${festival.name}`,
      type: 'info',
      title: `Festival Preparation - ${festival.name}`,
      message: `${festival.name} approaching in ${daysUntil} days. Expected ${festival.surge} surge. Begin preparation checklist.`,
      timestamp: `${daysUntil} days away`,
      timestampRaw: festivalDate,
      status: 'active',
      icon: Info,
      category: 'festival',
    });
  });

  // 5. Real-time patient load simulation
  const currentLoad = Math.floor(420 + Math.random() * 80); // Simulate 420-500 patients
  if (currentLoad > 450) {
    alerts.push({
      id: 'patient-load-high',
      type: 'warning',
      title: 'Patient Load Above Threshold',
      message: `Current patient count: ${currentLoad}. Consider activating overflow protocols and calling on-call staff.`,
      timestamp: getRelativeTime(new Date(now.getTime() - 15 * 60 * 1000)),
      timestampRaw: new Date(now.getTime() - 15 * 60 * 1000),
      status: 'active',
      icon: TrendingUp,
      category: 'patient',
    });
  }

  // 6. Success notifications
  const recentFestivals = INDIAN_FESTIVALS_2026.filter(f => {
    const festDate = new Date(f.date);
    const diff = now.getTime() - festDate.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 3;
  });

  if (recentFestivals.length > 0) {
    alerts.push({
      id: 'staff-schedule-success',
      type: 'success',
      title: 'Staff Schedule Successfully Updated',
      message: `Additional staff deployed for ${recentFestivals[0].name}. Emergency protocols activated.`,
      timestamp: getRelativeTime(new Date(now.getTime() - 6 * 60 * 60 * 1000)),
      timestampRaw: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      status: 'resolved',
      icon: CheckCircle,
      category: 'staffing',
    });
  }

  // 7. Epidemic monitoring (real-time simulation)
  const isDengueSeason = now.getMonth() >= 6 && now.getMonth() <= 10; // July to November
  if (isDengueSeason) {
    const weeklyIncrease = Math.floor(10 + Math.random() * 15);
    alerts.push({
      id: 'epidemic-dengue',
      type: 'info',
      title: 'Dengue Cases Monitoring',
      message: `Seasonal dengue monitoring active. ${weeklyIncrease}% weekly increase observed. Stock platelet units and diagnostic kits.`,
      timestamp: getRelativeTime(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
      timestampRaw: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      status: 'active',
      icon: Info,
      category: 'epidemic',
    });
  }

  // 8. Inventory alerts
  const isPreFestival = nextFestival && new Date(nextFestival.date).getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;
  if (isPreFestival) {
    alerts.push({
      id: 'inventory-check',
      type: 'warning',
      title: 'Inventory Check Required',
      message: `Festival preparation: Verify stock levels for burn treatment kits, oxygen cylinders, and respiratory medicines before ${nextFestival?.name}.`,
      timestamp: getRelativeTime(new Date(now.getTime() - 45 * 60 * 1000)),
      timestampRaw: new Date(now.getTime() - 45 * 60 * 1000),
      status: 'active',
      icon: AlertTriangle,
      category: 'inventory',
    });
  }

  // Sort by timestamp (most recent first)
  return alerts.sort((a, b) => b.timestampRaw.getTime() - a.timestampRaw.getTime());
}

/**
 * Get relative time string
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

/**
 * Get alert statistics
 */
export function getAlertStatistics(alerts: RealTimeAlert[]) {
  return {
    critical: alerts.filter(a => a.type === 'critical' && a.status === 'active').length,
    warning: alerts.filter(a => a.type === 'warning' && a.status === 'active').length,
    info: alerts.filter(a => a.type === 'info' && a.status === 'active').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };
}

/**
 * Filter alerts by category
 */
export function filterAlertsByCategory(alerts: RealTimeAlert[], category: string): RealTimeAlert[] {
  if (category === 'all') return alerts;
  return alerts.filter(a => a.category === category);
}

/**
 * Get active critical alerts
 */
export function getCriticalAlerts(alerts: RealTimeAlert[]): RealTimeAlert[] {
  return alerts.filter(a => a.type === 'critical' && a.status === 'active');
}

/* updated */
