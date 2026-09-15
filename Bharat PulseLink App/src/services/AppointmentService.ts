import {
  AppointmentItem,
  AppointmentListResponse,
  BookAppointmentPayload,
} from '../types/appointments';
import SecureStoreService from './secureStore';

export class AppointmentService {
  private static getStorageKey(userId: string): string {
    return `bharat_appointments_${userId}`;
  }

  public static async getAppointments(userId: string = 'user_patient_primary'): Promise<AppointmentListResponse> {
    try {
      const key = this.getStorageKey(userId);
      const raw = await SecureStoreService.get(key);
      if (raw) {
        const all: AppointmentItem[] = JSON.parse(raw);
        return this.categorizeAppointments(all);
      }
      return { upcoming: [], completed: [] };
    } catch (err) {
      console.warn('[APPT_SERVICE] Error reading appointments:', err);
      return { upcoming: [], completed: [] };
    }
  }

  public static async getAppointmentById(
    userId: string,
    appointmentId: string
  ): Promise<AppointmentItem | null> {
    const { upcoming, completed } = await this.getAppointments(userId);
    const found = [...upcoming, ...completed].find((a) => a.id === appointmentId);
    return found || null;
  }

  public static async bookAppointment(
    userId: string,
    payload: BookAppointmentPayload
  ): Promise<AppointmentItem> {
    const newAppointment: AppointmentItem = {
      id: `appt_${Date.now()}`,
      hospitalName: payload.hospitalName,
      department: payload.department,
      specialty: payload.specialty,
      doctorName: payload.doctorName,
      scheduledAtISO: payload.scheduledAtISO,
      displayDate: payload.displayDate,
      displayTime: payload.displayTime,
      status: 'CONFIRMED',
      bookingReference: `BPL-${Math.floor(100000 + Math.random() * 900000)}`,
      locationAddress: payload.locationAddress || 'Main Outpatient Pavilion',
    };

    const { upcoming, completed } = await this.getAppointments(userId);
    const all = [newAppointment, ...upcoming, ...completed];
    await this.saveAppointments(userId, all);

    return newAppointment;
  }

  public static async cancelAppointment(
    userId: string,
    appointmentId: string
  ): Promise<AppointmentListResponse> {
    const { upcoming, completed } = await this.getAppointments(userId);
    const all = [...upcoming, ...completed].map((appt) =>
      appt.id === appointmentId ? { ...appt, status: 'CANCELLED' as const } : appt
    );
    await this.saveAppointments(userId, all);
    return this.categorizeAppointments(all);
  }

  private static categorizeAppointments(all: AppointmentItem[]): AppointmentListResponse {
    const upcoming: AppointmentItem[] = [];
    const completed: AppointmentItem[] = [];

    all.forEach((item) => {
      if (item.status === 'COMPLETED' || item.status === 'CANCELLED' || item.status === 'NO_SHOW') {
        completed.push(item);
      } else {
        upcoming.push(item);
      }
    });

    return { upcoming, completed };
  }

  private static async saveAppointments(userId: string, appointments: AppointmentItem[]): Promise<void> {
    try {
      const key = this.getStorageKey(userId);
      await SecureStoreService.set(key, JSON.stringify(appointments));
    } catch (err) {
      console.warn('[APPT_SERVICE] Error persisting appointments:', err);
    }
  }
}

export default AppointmentService;
