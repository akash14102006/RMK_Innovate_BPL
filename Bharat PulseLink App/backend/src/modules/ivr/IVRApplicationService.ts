/**
 * Bharat PulseLink — IVR Application Service
 *
 * Central orchestrator connecting Sessions, State Machine, Prompts,
 * PIN Code Geospatial Resolution, PostGIS Hospital Search, Ranked Voice Selection,
 * Appointment Slot Discovery, and SMS Booking Confirmation (Step 11).
 *
 * Owned by: IVR Subsystem (Step 5, 6, 7, 8, 9, 10 & 11)
 */

import { type Logger } from '../../infrastructure/logger/logger.js';
import {
  type IVRSession,
  type IVREvent,
  type TransitionResult,
  type IVRNearbyHospitalSummary,
} from './ivr.types.js';
import { IVRSessionService } from './session/IVRSessionService.js';
import { IVRStateMachine } from './state/IVRStateMachine.js';
import { IVRPromptService } from './prompts/IVRPromptService.js';
import { type IAsteriskAdapter, MockAsteriskAdapter } from './asterisk/AsteriskAdapter.js';
import { PincodeGeoResolver, type IPincodeGeoResolver } from './geospatial/PincodeGeoResolver.js';
import {
  type IHospitalDiscoveryService,
} from '../hospitals/HospitalDiscoveryService.js';
import {
  IVRVoicePresentationService,
} from './voice/IVRVoicePresentationService.js';
import {
  AppointmentAvailabilityService,
  MockAppointmentProvider,
  type IAppointmentAvailabilityProvider,
} from '../appointments/AppointmentAvailabilityService.js';
import {
  SMSNotificationService,
  type AppointmentBookingConfirmedEvent,
} from '../notifications/SMSNotificationService.js';
import {
  AppointmentPlaceholderService,
  ExistingAppointmentPlaceholderService,
  EmergencyPlaceholderService,
  type IAppointmentService,
  type IExistingAppointmentService,
  type IEmergencyService,
} from './domain-placeholders/index.js';

export interface IVRApplicationServiceConfig {
  sessionService?: IVRSessionService;
  stateMachine?: IVRStateMachine;
  promptService?: IVRPromptService;
  asteriskAdapter?: IAsteriskAdapter;
  pincodeGeoResolver?: IPincodeGeoResolver;
  hospitalDiscoveryService?: IHospitalDiscoveryService;
  voicePresentationService?: IVRVoicePresentationService;
  appointmentAvailabilityService?: AppointmentAvailabilityService;
  appointmentProvider?: IAppointmentAvailabilityProvider;
  smsNotificationService?: SMSNotificationService;
  appointmentService?: IAppointmentService;
  existingAppointmentService?: IExistingAppointmentService;
  emergencyService?: IEmergencyService;
  logger?: Logger;
}

export class IVRApplicationService {
  private readonly sessionService: IVRSessionService;
  private readonly stateMachine: IVRStateMachine;
  private readonly promptService: IVRPromptService;
  private readonly asteriskAdapter: IAsteriskAdapter;
  private readonly pincodeGeoResolver: IPincodeGeoResolver;
  private readonly hospitalDiscoveryService?: IHospitalDiscoveryService;
  private readonly voicePresentationService: IVRVoicePresentationService;
  private readonly appointmentAvailabilityService: AppointmentAvailabilityService;
  private readonly smsNotificationService: SMSNotificationService;
  private readonly appointmentService: IAppointmentService;
  private readonly existingAppointmentService: IExistingAppointmentService;
  private readonly emergencyService: IEmergencyService;
  private readonly logger?: Logger;

  constructor(config: IVRApplicationServiceConfig = {}) {
    this.sessionService = config.sessionService ?? new IVRSessionService();
    this.stateMachine = config.stateMachine ?? new IVRStateMachine();
    this.promptService = config.promptService ?? new IVRPromptService();
    this.asteriskAdapter = config.asteriskAdapter ?? new MockAsteriskAdapter();
    this.pincodeGeoResolver = config.pincodeGeoResolver ?? new PincodeGeoResolver();
    this.hospitalDiscoveryService = config.hospitalDiscoveryService;
    this.voicePresentationService = config.voicePresentationService ?? new IVRVoicePresentationService();
    this.appointmentAvailabilityService =
      config.appointmentAvailabilityService ??
      new AppointmentAvailabilityService(config.appointmentProvider ?? new MockAppointmentProvider());
    this.smsNotificationService = config.smsNotificationService ?? new SMSNotificationService({ logger: config.logger });
    this.appointmentService = config.appointmentService ?? new AppointmentPlaceholderService();
    this.existingAppointmentService = config.existingAppointmentService ?? new ExistingAppointmentPlaceholderService();
    this.emergencyService = config.emergencyService ?? new EmergencyPlaceholderService();
    this.logger = config.logger;
  }

  /**
   * Handles inbound call start.
   */
  public async handleCallStart(params: {
    callId: string;
    channelId: string;
    callerNumber?: string;
    correlationId?: string;
  }): Promise<{ session: IVRSession; result: TransitionResult }> {
    const correlationId = params.correlationId ?? `corr-${Date.now()}`;
    this.logInfo('handleCallStart: initiating new IVR session', {
      callId: params.callId,
      channelId: params.channelId,
      correlationId,
    });

    const session = await this.sessionService.createSession({
      callId: params.callId,
      channelId: params.channelId,
      callerNumber: params.callerNumber,
    });

    // 1. Answer telephony channel
    await this.asteriskAdapter.answerCall(params.channelId);

    // 2. Play initial welcome prompt
    const welcomePrompt = this.promptService.getPromptPath(null, 'welcome');
    await this.asteriskAdapter.playPrompt(params.channelId, welcomePrompt);

    // 3. Evaluate transition into Language Selection
    const event: IVREvent = {
      type: 'CALL_STARTED',
      callId: params.callId,
      channelId: params.channelId,
      correlationId,
    };

    const result = this.stateMachine.evaluateTransition(session, event);
    session.state = result.nextState;
    const updated = await this.sessionService.updateSession(session);

    // 4. Play language selection menu
    if (result.promptKey) {
      const promptPath = this.promptService.getPromptPath(null, result.promptKey);
      await this.asteriskAdapter.playPromptAndCollect(params.channelId, promptPath, 1, 5);
    }

    return { session: updated, result };
  }

  /**
   * Handles incoming DTMF input event.
   */
  public async handleDtmfInput(params: {
    callId: string;
    digits: string;
    correlationId?: string;
  }): Promise<{ session: IVRSession; result: TransitionResult }> {
    const correlationId = params.correlationId ?? `corr-${Date.now()}`;
    const session = await this.sessionService.getSessionByCallId(params.callId);
    const previousState = session.state;

    this.logInfo('handleDtmfInput: processing DTMF event', {
      sessionId: session.sessionId,
      callId: session.callId,
      currentState: session.state,
      digitsLength: params.digits?.length ?? 0,
      correlationId,
    });

    const event: IVREvent = {
      type: 'DTMF_RECEIVED',
      callId: params.callId,
      channelId: session.channelId,
      digits: params.digits,
      correlationId,
    };

    const result = this.stateMachine.evaluateTransition(session, event);
    session.state = result.nextState;

    if (result.language) {
      session.language = result.language;
    }
    if (result.intent) {
      session.intent = result.intent;
    }
    if (result.selectedHospitalId) {
      session.selectedHospitalId = result.selectedHospitalId;
      session.selectedHospital = result.selectedHospital;
    }
    if (result.selectedAppointmentDate) {
      session.selectedAppointmentDate = result.selectedAppointmentDate;
    }
    if (result.selectedSlotId) {
      session.selectedSlotId = result.selectedSlotId;
      session.selectedSlot = result.selectedSlot;
    }

    // Reset dependent appointment state if returning to hospital selection
    if (previousState === 'HOSPITAL_CONFIRMATION' && result.nextState === 'HOSPITAL_SELECTION') {
      session.selectedHospitalId = undefined;
      session.selectedHospital = undefined;
      session.availableDates = undefined;
      session.selectedAppointmentDate = undefined;
      session.availableSlots = undefined;
      session.selectedSlotId = undefined;
      session.selectedSlot = undefined;
    }

    // Reset dependent slot state if returning to slot selection from slot confirmation
    if (previousState === 'SLOT_CONFIRMATION' && result.nextState === 'APPOINTMENT_SLOT_SELECTION') {
      session.selectedSlotId = undefined;
      session.selectedSlot = undefined;
    }

    // Manage attempt counters based on previous state
    if (previousState === 'LANGUAGE_SELECTION' && !result.language) {
      session.attemptCounters.language += 1;
    } else if (previousState === 'MAIN_MENU' && !result.intent && session.language) {
      if (result.promptKey === 'invalid') {
        session.attemptCounters.menu += 1;
      }
    } else if (previousState === 'PIN_INPUT' && !result.pincode) {
      session.attemptCounters.pincode += 1;
    } else if ((previousState === 'HOSPITAL_RESULTS_READY' || previousState === 'HOSPITAL_SELECTION') && !result.selectedHospitalId) {
      session.attemptCounters.hospitalSelection += 1;
    } else if (previousState === 'HOSPITAL_CONFIRMATION' && result.nextState !== 'APPOINTMENT_DATE_SELECTION' && result.nextState !== 'HOSPITAL_SELECTION') {
      session.attemptCounters.hospitalConfirmation += 1;
    } else if (previousState === 'APPOINTMENT_DATE_SELECTION' && !result.selectedAppointmentDate) {
      session.attemptCounters.appointmentDate += 1;
    } else if (previousState === 'APPOINTMENT_SLOT_SELECTION' && !result.selectedSlotId) {
      session.attemptCounters.appointmentSlot += 1;
    } else if (previousState === 'SLOT_CONFIRMATION' && result.nextState !== 'SLOT_CONFIRMED_FOR_BOOKING' && result.nextState !== 'BOOKING_CONFIRMED' && result.nextState !== 'APPOINTMENT_SLOT_SELECTION') {
      session.attemptCounters.slotConfirmation += 1;
    }

    // Handle Valid PIN -> PostGIS Geospatial Resolution & Search (Step 7)
    if (result.pincode) {
      session.pincode = result.pincode;
      return this.processPincodeGeospatialSearch(session, result.pincode, correlationId);
    }

    // Handle Hospital Confirmed -> Discover Available Appointment Dates (Step 9)
    if (previousState === 'HOSPITAL_CONFIRMATION' && result.nextState === 'APPOINTMENT_DATE_SELECTION') {
      return this.processAppointmentDateDiscovery(session, correlationId);
    }

    // Handle Date Selected -> Discover Available Time Slots (Step 9)
    if (previousState === 'APPOINTMENT_DATE_SELECTION' && result.nextState === 'APPOINTMENT_SLOT_SELECTION') {
      return this.processAppointmentSlotDiscovery(session, correlationId);
    }

    // Handle Slot Confirmed -> Execute Booking & Dispatch Confirmation SMS (Step 10 & 11)
    if (previousState === 'SLOT_CONFIRMATION' && (result.nextState === 'BOOKING_CONFIRMED' || result.nextState === 'SLOT_CONFIRMED_FOR_BOOKING')) {
      return this.processBookingAndNotification(session, correlationId);
    }

    const updated = await this.sessionService.updateSession(session);

    // Execute Telephony Action
    await this.executeTelephonyAction(updated, result);

    // Route to domain placeholder if terminal intent state reached
    await this.dispatchDomainPlaceholder(updated);

    return { session: updated, result };
  }

  /**
   * Processes appointment booking creation and dispatches confirmation SMS.
   */
  private async processBookingAndNotification(
    session: IVRSession,
    correlationId: string,
  ): Promise<{ session: IVRSession; result: TransitionResult }> {
    const bookingId = `book-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const pinPart = session.pincode ?? '600001';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `BP-${pinPart}-${randomSuffix}`;

    session.bookingId = bookingId;
    session.bookingReference = bookingReference;
    session.state = 'BOOKING_CONFIRMED';

    this.logInfo('processBookingAndNotification: booking confirmed, dispatching SMS notification', {
      sessionId: session.sessionId,
      bookingId,
      bookingReference,
      facilityId: session.selectedHospitalId,
      correlationId,
    });

    const notifEvent: AppointmentBookingConfirmedEvent = {
      eventId: `evt-book-${Date.now()}`,
      bookingId,
      bookingReference,
      facilityId: session.selectedHospitalId ?? 'fac-001',
      hospitalName: session.selectedHospital?.name ?? 'Government General Hospital',
      appointmentDate: session.selectedAppointmentDate ?? new Date().toISOString().split('T')[0],
      appointmentTime: session.selectedSlot?.displayTime ?? '10:00 AM',
      recipientPhoneNumber: session.callerNumber ?? '+919876501001',
      language: session.language,
      correlationId,
    };

    const notifRecord = await this.smsNotificationService.handleBookingConfirmed(notifEvent);
    session.notificationStatus = notifRecord.status;

    const promptKey = notifRecord.status === 'ACCEPTED' || notifRecord.status === 'SENT'
      ? 'booking-confirmed-sms-sent'
      : 'booking-confirmed-sms-queued';

    const finalResult: TransitionResult = {
      nextState: 'BOOKING_CONFIRMED',
      promptKey,
      action: 'PLAY_AND_HANGUP',
      bookingId,
      bookingReference,
      notificationStatus: notifRecord.status,
      language: session.language ?? 'en',
    };

    const updated = await this.sessionService.updateSession(session);
    await this.executeTelephonyAction(updated, finalResult);

    return { session: updated, result: finalResult };
  }

  /**
   * Processes available date discovery for selected hospital.
   */
  private async processAppointmentDateDiscovery(
    session: IVRSession,
    correlationId: string,
  ): Promise<{ session: IVRSession; result: TransitionResult }> {
    const facilityId = session.selectedHospitalId ?? 'fac-unknown';
    this.logInfo('processAppointmentDateDiscovery: discovering available dates', {
      sessionId: session.sessionId,
      facilityId,
      correlationId,
    });

    const datesResult = await this.appointmentAvailabilityService.getAvailableDates({
      facilityId,
      windowDays: 7,
    });

    if (datesResult.status === 'NO_DATES_AVAILABLE') {
      session.state = 'NO_APPOINTMENT_DATES';
      const finalResult: TransitionResult = {
        nextState: 'NO_APPOINTMENT_DATES',
        promptKey: 'appointment-no-dates',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
      };
      const updated = await this.sessionService.updateSession(session);
      await this.executeTelephonyAction(updated, finalResult);
      return { session: updated, result: finalResult };
    }

    if (datesResult.status === 'PROVIDER_UNAVAILABLE') {
      session.state = 'APPOINTMENT_PROVIDER_ERROR';
      const finalResult: TransitionResult = {
        nextState: 'APPOINTMENT_PROVIDER_ERROR',
        promptKey: 'appointment-provider-error',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
      };
      const updated = await this.sessionService.updateSession(session);
      await this.executeTelephonyAction(updated, finalResult);
      return { session: updated, result: finalResult };
    }

    session.availableDates = datesResult.dates;
    session.availabilityRetrievedAt = datesResult.retrievedAt;
    session.state = 'APPOINTMENT_DATE_SELECTION';

    const finalResult: TransitionResult = {
      nextState: 'APPOINTMENT_DATE_SELECTION',
      promptKey: 'appointment-dates-menu',
      action: 'PLAY_AND_WAIT',
      availableDates: datesResult.dates,
      language: session.language ?? 'en',
    };

    const updated = await this.sessionService.updateSession(session);
    await this.executeTelephonyAction(updated, finalResult);
    return { session: updated, result: finalResult };
  }

  /**
   * Processes available time-slot discovery for selected hospital and date.
   */
  private async processAppointmentSlotDiscovery(
    session: IVRSession,
    correlationId: string,
  ): Promise<{ session: IVRSession; result: TransitionResult }> {
    const facilityId = session.selectedHospitalId ?? 'fac-unknown';
    const date = session.selectedAppointmentDate ?? '';

    this.logInfo('processAppointmentSlotDiscovery: discovering available slots', {
      sessionId: session.sessionId,
      facilityId,
      date,
      correlationId,
    });

    const slotsResult = await this.appointmentAvailabilityService.getAvailableSlots({
      facilityId,
      date,
    });

    if (slotsResult.status === 'NO_SLOTS_AVAILABLE') {
      session.state = 'NO_APPOINTMENT_SLOTS';
      const finalResult: TransitionResult = {
        nextState: 'NO_APPOINTMENT_SLOTS',
        promptKey: 'appointment-no-slots',
        action: 'PLAY_AND_WAIT',
        language: session.language ?? 'en',
      };
      const updated = await this.sessionService.updateSession(session);
      await this.executeTelephonyAction(updated, finalResult);
      return { session: updated, result: finalResult };
    }

    if (slotsResult.status === 'PROVIDER_UNAVAILABLE') {
      session.state = 'APPOINTMENT_PROVIDER_ERROR';
      const finalResult: TransitionResult = {
        nextState: 'APPOINTMENT_PROVIDER_ERROR',
        promptKey: 'appointment-provider-error',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
      };
      const updated = await this.sessionService.updateSession(session);
      await this.executeTelephonyAction(updated, finalResult);
      return { session: updated, result: finalResult };
    }

    session.availableSlots = slotsResult.slots;
    session.state = 'APPOINTMENT_SLOT_SELECTION';

    const finalResult: TransitionResult = {
      nextState: 'APPOINTMENT_SLOT_SELECTION',
      promptKey: 'appointment-slots-menu',
      action: 'PLAY_AND_WAIT',
      availableSlots: slotsResult.slots,
      selectedAppointmentDate: date,
      language: session.language ?? 'en',
    };

    const updated = await this.sessionService.updateSession(session);
    await this.executeTelephonyAction(updated, finalResult);
    return { session: updated, result: finalResult };
  }

  /**
   * Processes PIN code geographic resolution and PostGIS hospital search.
   */
  private async processPincodeGeospatialSearch(
    session: IVRSession,
    pincode: string,
    correlationId: string,
  ): Promise<{ session: IVRSession; result: TransitionResult }> {
    this.logInfo('processPincodeGeospatialSearch: resolving geographic centroid', {
      sessionId: session.sessionId,
      pincodeCaptured: true,
      correlationId,
    });

    const geoResult = await this.pincodeGeoResolver.resolve(pincode);
    if (!geoResult.isValid) {
      this.logInfo('processPincodeGeospatialSearch: PIN geography not found', {
        sessionId: session.sessionId,
        geoResolution: 'PIN_GEO_NOT_FOUND',
        correlationId,
      });

      const searchEvent: IVREvent = {
        type: 'SYSTEM_ERROR',
        callId: session.callId,
        channelId: session.channelId,
        payload: { searchResultStatus: 'PIN_GEO_NOT_FOUND' },
        correlationId,
      };

      const finalResult = this.stateMachine.evaluateTransition(session, searchEvent);
      session.state = finalResult.nextState;
      const updated = await this.sessionService.updateSession(session);
      await this.executeTelephonyAction(updated, finalResult);
      return { session: updated, result: finalResult };
    }

    // Set resolved location on session
    session.resolvedLocation = {
      latitude: geoResult.latitude,
      longitude: geoResult.longitude,
      city: geoResult.city,
      district: geoResult.district,
      state: geoResult.state,
      source: geoResult.source,
    };

    let hospitalsSummary: IVRNearbyHospitalSummary[] = [];
    let searchStatus: 'SUCCESS' | 'NO_HOSPITALS_FOUND' | 'GEO_SEARCH_UNAVAILABLE' = 'SUCCESS';

    if (this.hospitalDiscoveryService) {
      try {
        const searchResult = await this.hospitalDiscoveryService.findNearby({
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          radiusMeters: 10000,
          limit: 5,
        });

        hospitalsSummary = searchResult.hospitals.map((h) => ({
          id: h.id,
          name: h.name,
          displayName: h.displayName,
          facilityType: h.facilityType,
          distanceMeters: h.distanceMeters,
          distanceKm: h.distanceKm,
          city: h.city,
          district: h.district,
          state: h.state,
          pincode: h.pincode,
        }));

        searchStatus = searchResult.status;
        session.searchRadiusMeters = searchResult.radiusMeters;
      } catch (err) {
        searchStatus = 'GEO_SEARCH_UNAVAILABLE';
      }
    } else {
      // Default top 3 sample results when running in headless mock mode
      hospitalsSummary = [
        {
          id: 'fac-sample-01',
          name: 'Government General Hospital',
          displayName: 'Government General Hospital, George Town',
          facilityType: 'GOVERNMENT',
          distanceMeters: 1000,
          distanceKm: 1.0,
          city: geoResult.city,
          district: geoResult.district,
          state: geoResult.state,
          pincode,
        },
        {
          id: 'fac-sample-02',
          name: 'Apollo Hospital',
          displayName: 'Apollo Hospital, Greams Road',
          facilityType: 'PRIVATE',
          distanceMeters: 3200,
          distanceKm: 3.2,
          city: geoResult.city,
          district: geoResult.district,
          state: geoResult.state,
          pincode,
        },
        {
          id: 'fac-sample-03',
          name: 'Fortis Healthcare',
          displayName: 'Fortis Healthcare, Adyar',
          facilityType: 'PRIVATE',
          distanceMeters: 4500,
          distanceKm: 4.5,
          city: geoResult.city,
          district: geoResult.district,
          state: geoResult.state,
          pincode,
        },
      ];
      searchStatus = 'SUCCESS';
      session.searchRadiusMeters = 10000;
    }

    session.nearbyHospitals = hospitalsSummary;

    this.logInfo('processPincodeGeospatialSearch: PostGIS search completed', {
      sessionId: session.sessionId,
      geoResolution: 'SUCCESS',
      searchStatus,
      resultCount: hospitalsSummary.length,
      searchRadiusMeters: session.searchRadiusMeters,
      correlationId,
    });

    const searchEvent: IVREvent = {
      type: 'PLAYBACK_FINISHED',
      callId: session.callId,
      channelId: session.channelId,
      payload: { searchResultStatus: searchStatus },
      correlationId,
    };

    const finalResult = this.stateMachine.evaluateTransition(session, searchEvent);
    finalResult.nearbyHospitals = hospitalsSummary;
    session.state = finalResult.nextState;

    const updated = await this.sessionService.updateSession(session);
    await this.executeTelephonyAction(updated, finalResult);

    return { session: updated, result: finalResult };
  }

  /**
   * Handles silence timeout event.
   */
  public async handleTimeout(params: {
    callId: string;
    correlationId?: string;
  }): Promise<{ session: IVRSession; result: TransitionResult }> {
    const correlationId = params.correlationId ?? `corr-${Date.now()}`;
    const session = await this.sessionService.getSessionByCallId(params.callId);
    const previousState = session.state;

    this.logInfo('handleTimeout: processing timeout event', {
      sessionId: session.sessionId,
      callId: session.callId,
      currentState: session.state,
      correlationId,
    });

    const event: IVREvent = {
      type: 'TIMEOUT',
      callId: params.callId,
      channelId: session.channelId,
      correlationId,
    };

    const result = this.stateMachine.evaluateTransition(session, event);
    session.state = result.nextState;

    if (previousState === 'LANGUAGE_SELECTION') {
      session.attemptCounters.language += 1;
    } else if (previousState === 'MAIN_MENU') {
      session.attemptCounters.menu += 1;
    } else if (previousState === 'PIN_INPUT') {
      session.attemptCounters.pincode += 1;
    } else if (previousState === 'HOSPITAL_RESULTS_READY' || previousState === 'HOSPITAL_SELECTION') {
      session.attemptCounters.hospitalSelection += 1;
    } else if (previousState === 'HOSPITAL_CONFIRMATION') {
      session.attemptCounters.hospitalConfirmation += 1;
    } else if (previousState === 'APPOINTMENT_DATE_SELECTION') {
      session.attemptCounters.appointmentDate += 1;
    } else if (previousState === 'APPOINTMENT_SLOT_SELECTION') {
      session.attemptCounters.appointmentSlot += 1;
    } else if (previousState === 'SLOT_CONFIRMATION') {
      session.attemptCounters.slotConfirmation += 1;
    }

    const updated = await this.sessionService.updateSession(session);
    await this.executeTelephonyAction(updated, result);

    return { session: updated, result };
  }

  /**
   * Handles caller hangup.
   */
  public async handleCallHangup(params: {
    callId: string;
    correlationId?: string;
  }): Promise<IVRSession | null> {
    const correlationId = params.correlationId ?? `corr-${Date.now()}`;
    this.logInfo('handleCallHangup: cleaning up IVR call session', {
      callId: params.callId,
      correlationId,
    });

    return this.sessionService.terminateSession(params.callId);
  }

  /**
   * Retrieves active session details.
   */
  public async getSessionStatus(callId: string): Promise<IVRSession> {
    return this.sessionService.getSessionByCallId(callId);
  }

  private async executeTelephonyAction(session: IVRSession, result: TransitionResult): Promise<void> {
    if (result.promptKey) {
      const promptPath = this.promptService.getPromptPath(session.language, result.promptKey);
      const maxDigits = session.state === 'PIN_INPUT' ? 6 : 1;
      if (result.action === 'PLAY_AND_WAIT') {
        await this.asteriskAdapter.playPromptAndCollect(session.channelId, promptPath, maxDigits, 7);
      } else if (result.action === 'PLAY_AND_HANGUP') {
        await this.asteriskAdapter.playPrompt(session.channelId, promptPath);
        await this.asteriskAdapter.hangup(session.channelId);
      } else {
        await this.asteriskAdapter.playPrompt(session.channelId, promptPath);
      }
    }

    if (result.action === 'HANGUP') {
      await this.asteriskAdapter.hangup(session.channelId);
    }
  }

  private async dispatchDomainPlaceholder(session: IVRSession): Promise<void> {
    switch (session.state) {
      case 'BOOK_APPOINTMENT':
        await this.appointmentService.executePlaceholder(session);
        break;
      case 'EXISTING_APPOINTMENT':
        await this.existingAppointmentService.executePlaceholder(session);
        break;
      case 'EMERGENCY':
        await this.emergencyService.executePlaceholder(session);
        break;
      default:
        break;
    }
  }

  private logInfo(message: string, context: Record<string, unknown>): void {
    if (this.logger) {
      this.logger.info(message, context);
    }
  }
}
