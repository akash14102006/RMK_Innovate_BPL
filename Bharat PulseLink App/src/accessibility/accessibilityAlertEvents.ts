/**
 * Bharat PulseLink - Accessibility Alert Event Bus
 *
 * Decoupled event emitter for accessibility alerts to eliminate
 * circular dependency between AccessibilityContext and AccessibilityAlertManager.
 */

export type AlertType = 'SUCCESS' | 'WARNING' | 'ERROR' | 'EMERGENCY' | 'INFORMATION';

export interface AccessibilityAlertPayload {
  id?: string;
  type: AlertType;
  title: string;
  message: string;
  durationMs?: number;
}

type AlertListener = (alert: AccessibilityAlertPayload) => void;
const listeners = new Set<AlertListener>();

/**
 * Dispatch an accessibility visual alert across the application.
 */
export function triggerAccessibilityAlert(payload: AccessibilityAlertPayload): void {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (err) {
      console.warn('[ACCESSIBILITY_ALERT] Listener error:', err);
    }
  });
}

/**
 * Subscribe to accessibility alerts.
 * Returns an unsubscribe function.
 */
export function subscribeAccessibilityAlert(listener: AlertListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
