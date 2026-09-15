/**
 * Bharat PulseLink — IVR State Machine
 *
 * Pure, deterministic transition evaluator.
 * Manages states, bounded retry counters, intent resolution, PIN code collection,
 * PostGIS hospital search transitions, ranked hospital voice selection, and appointment slot discovery.
 *
 * Owned by: IVR Subsystem (Step 5, 6, 7, 8 & 9)
 */

import {
  type IVRSession,
  type IVREvent,
  type TransitionResult,
} from '../ivr.types.js';
import { IVRLanguageService } from '../language/IVRLanguageService.js';
import { IVRMenuService } from '../menus/IVRMenuService.js';
import { IVRPincodeValidator } from '../pincode/IVRPincodeValidator.js';

export class IVRStateMachine {
  private readonly languageService: IVRLanguageService;
  private readonly menuService: IVRMenuService;
  private static readonly MAX_ATTEMPTS = 3;

  constructor(
    languageService?: IVRLanguageService,
    menuService?: IVRMenuService,
  ) {
    this.languageService = languageService ?? new IVRLanguageService();
    this.menuService = menuService ?? new IVRMenuService();
  }

  /**
   * Evaluates the next transition based on current session state and incoming event.
   */
  public evaluateTransition(session: IVRSession, event: IVREvent): TransitionResult {
    // Universal early hangup handling
    if (event.type === 'CALL_HANGUP') {
      return {
        nextState: 'TERMINATED',
        promptKey: null,
        action: 'HANGUP',
      };
    }

    switch (session.state) {
      case 'CALL_RECEIVED':
        return this.handleCallReceived(session, event);

      case 'LANGUAGE_SELECTION':
        return this.handleLanguageSelection(session, event);

      case 'MAIN_MENU':
        return this.handleMainMenu(session, event);

      case 'FIND_HOSPITAL':
      case 'PIN_INPUT':
        return this.handlePinInput(session, event);

      case 'PIN_VALIDATED':
      case 'HOSPITAL_SEARCHING':
        return this.handleHospitalSearching(session, event);

      case 'HOSPITAL_RESULTS_READY':
      case 'HOSPITAL_SELECTION':
        return this.handleHospitalSelection(session, event);

      case 'HOSPITAL_CONFIRMATION':
        return this.handleHospitalConfirmation(session, event);

      case 'HOSPITAL_CONFIRMED':
      case 'APPOINTMENT_DATE_SELECTION':
        return this.handleAppointmentDateSelection(session, event);

      case 'APPOINTMENT_SLOT_SELECTION':
        return this.handleAppointmentSlotSelection(session, event);

      case 'SLOT_CONFIRMATION':
        return this.handleSlotConfirmation(session, event);

      case 'SLOT_CONFIRMED_FOR_BOOKING':
      case 'NO_APPOINTMENT_DATES':
      case 'NO_APPOINTMENT_SLOTS':
      case 'APPOINTMENT_PROVIDER_ERROR':
      case 'NO_HOSPITALS_FOUND':
      case 'HOSPITAL_SEARCH_FAILED':
      case 'BOOK_APPOINTMENT':
      case 'EXISTING_APPOINTMENT':
      case 'EMERGENCY':
        return this.handlePlaceholderState(session, event);

      case 'COMPLETED':
      case 'FAILED':
      case 'TERMINATED':
        return {
          nextState: session.state,
          promptKey: null,
          action: 'HANGUP',
        };

      default:
        return {
          nextState: 'FAILED',
          promptKey: 'goodbye',
          action: 'PLAY_AND_HANGUP',
          error: `Unhandled session state: ${session.state}`,
        };
    }
  }

  private handleCallReceived(_session: IVRSession, event: IVREvent): TransitionResult {
    if (event.type === 'CALL_STARTED' || event.type === 'PLAYBACK_FINISHED') {
      return {
        nextState: 'LANGUAGE_SELECTION',
        promptKey: 'language-select',
        action: 'PLAY_AND_WAIT',
      };
    }

    return {
      nextState: 'LANGUAGE_SELECTION',
      promptKey: 'language-select',
      action: 'PLAY_AND_WAIT',
    };
  }

  private handleLanguageSelection(session: IVRSession, event: IVREvent): TransitionResult {
    if (event.type === 'DTMF_RECEIVED' && event.digits) {
      const selectedLanguage = this.languageService.resolveLanguageFromDtmf(event.digits);
      if (selectedLanguage) {
        return {
          nextState: 'MAIN_MENU',
          promptKey: 'main-menu',
          action: 'PLAY_AND_WAIT',
          language: selectedLanguage,
          intent: 'SELECT_LANGUAGE',
        };
      }

      // Invalid digit received
      const attempts = session.attemptCounters.language + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'LANGUAGE_SELECTION',
          promptKey: 'invalid',
          action: 'PLAY_AND_WAIT',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'goodbye',
        action: 'PLAY_AND_HANGUP',
        error: 'Max language selection attempts exceeded',
      };
    }

    if (event.type === 'TIMEOUT') {
      const attempts = session.attemptCounters.language + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'LANGUAGE_SELECTION',
          promptKey: 'timeout',
          action: 'PLAY_AND_WAIT',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'goodbye',
        action: 'PLAY_AND_HANGUP',
        error: 'Max language selection timeouts exceeded',
      };
    }

    return {
      nextState: 'LANGUAGE_SELECTION',
      promptKey: 'language-select',
      action: 'PLAY_AND_WAIT',
    };
  }

  private handleMainMenu(session: IVRSession, event: IVREvent): TransitionResult {
    if (event.type === 'DTMF_RECEIVED' && event.digits) {
      const menuItem = this.menuService.resolveMainMenuOption(event.digits);
      if (menuItem) {
        if (menuItem.intent === 'FIND_HOSPITAL') {
          return {
            nextState: 'PIN_INPUT',
            promptKey: 'enter-pincode',
            action: 'PLAY_AND_WAIT',
            intent: 'FIND_HOSPITAL',
            language: session.language ?? 'en',
          };
        }

        let promptKey: string;
        switch (menuItem.intent) {
          case 'BOOK_APPOINTMENT':
            promptKey = 'book-appointment';
            break;
          case 'EXISTING_APPOINTMENT':
            promptKey = 'existing-appointment';
            break;
          case 'EMERGENCY':
            promptKey = 'emergency';
            break;
          default:
            promptKey = 'main-menu';
        }

        return {
          nextState: menuItem.targetState,
          promptKey,
          action: 'PLAY_AND_HANGUP',
          intent: menuItem.intent,
          language: session.language ?? 'en',
        };
      }

      // Invalid menu digit
      const attempts = session.attemptCounters.menu + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'MAIN_MENU',
          promptKey: 'invalid',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'goodbye',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max menu selection attempts exceeded',
      };
    }

    if (event.type === 'TIMEOUT') {
      const attempts = session.attemptCounters.menu + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'MAIN_MENU',
          promptKey: 'timeout',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'goodbye',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max menu selection timeouts exceeded',
      };
    }

    return {
      nextState: 'MAIN_MENU',
      promptKey: 'main-menu',
      action: 'PLAY_AND_WAIT',
      language: session.language ?? 'en',
    };
  }

  private handlePinInput(session: IVRSession, event: IVREvent): TransitionResult {
    if (event.type === 'DTMF_RECEIVED' && event.digits) {
      const validation = IVRPincodeValidator.validate(event.digits);
      if (validation.isValid && validation.normalized) {
        return {
          nextState: 'PIN_VALIDATED',
          promptKey: 'pin-success',
          action: 'CONTINUE',
          pincode: validation.normalized,
          language: session.language ?? 'en',
          intent: 'FIND_HOSPITAL',
        };
      }

      // Invalid PIN format
      const attempts = session.attemptCounters.pincode + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'PIN_INPUT',
          promptKey: 'pin-invalid',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
          error: validation.error,
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'pin-max-attempts',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max PIN code entry attempts exceeded',
      };
    }

    if (event.type === 'TIMEOUT') {
      const attempts = session.attemptCounters.pincode + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'PIN_INPUT',
          promptKey: 'pin-timeout',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'pin-max-attempts',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max PIN code entry timeouts exceeded',
      };
    }

    return {
      nextState: 'PIN_INPUT',
      promptKey: 'enter-pincode',
      action: 'PLAY_AND_WAIT',
      language: session.language ?? 'en',
    };
  }

  private handleHospitalSearching(session: IVRSession, event: IVREvent): TransitionResult {
    if (event.payload?.searchResultStatus === 'SUCCESS') {
      return {
        nextState: 'HOSPITAL_SELECTION',
        promptKey: 'hospital-options-menu',
        action: 'PLAY_AND_WAIT',
        language: session.language ?? 'en',
        intent: 'FIND_HOSPITAL',
      };
    }

    if (event.payload?.searchResultStatus === 'NO_HOSPITALS_FOUND') {
      return {
        nextState: 'NO_HOSPITALS_FOUND',
        promptKey: 'no-hospitals-found',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        intent: 'FIND_HOSPITAL',
      };
    }

    if (event.payload?.searchResultStatus === 'GEO_SEARCH_UNAVAILABLE' || event.payload?.searchResultStatus === 'PIN_GEO_NOT_FOUND') {
      return {
        nextState: 'HOSPITAL_SEARCH_FAILED',
        promptKey: 'hospital-search-error',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        intent: 'FIND_HOSPITAL',
      };
    }

    return {
      nextState: 'HOSPITAL_SELECTION',
      promptKey: 'hospital-options-menu',
      action: 'PLAY_AND_WAIT',
      language: session.language ?? 'en',
    };
  }

  private handleHospitalSelection(session: IVRSession, event: IVREvent): TransitionResult {
    const availableHospitals = session.nearbyHospitals ?? [];
    const count = availableHospitals.length;

    if (event.type === 'DTMF_RECEIVED' && event.digits) {
      const selectedIndex = parseInt(event.digits, 10);
      if (!isNaN(selectedIndex) && selectedIndex >= 1 && selectedIndex <= count) {
        const selected = availableHospitals[selectedIndex - 1];
        const promptKey = selectedIndex <= 3 ? `hospital-confirm-${selectedIndex}` : 'hospital-confirm-1';
        return {
          nextState: 'HOSPITAL_CONFIRMATION',
          promptKey,
          action: 'PLAY_AND_WAIT',
          selectedHospitalId: selected.id,
          selectedHospital: selected,
          language: session.language ?? 'en',
          intent: 'FIND_HOSPITAL',
        };
      }

      // Invalid selection index
      const attempts = session.attemptCounters.hospitalSelection + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'HOSPITAL_SELECTION',
          promptKey: 'hospital-invalid-choice',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'hospital-max-attempts',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max hospital selection attempts exceeded',
      };
    }

    if (event.type === 'TIMEOUT') {
      const attempts = session.attemptCounters.hospitalSelection + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'HOSPITAL_SELECTION',
          promptKey: 'hospital-selection-timeout',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'hospital-max-attempts',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max hospital selection timeouts exceeded',
      };
    }

    return {
      nextState: 'HOSPITAL_SELECTION',
      promptKey: 'hospital-options-menu',
      action: 'PLAY_AND_WAIT',
      language: session.language ?? 'en',
    };
  }

  private handleHospitalConfirmation(session: IVRSession, event: IVREvent): TransitionResult {
    if (event.type === 'DTMF_RECEIVED' && event.digits) {
      if (event.digits === '1') {
        // Confirmed hospital selection -> Advance into Appointment Date Selection (Step 9)
        return {
          nextState: 'APPOINTMENT_DATE_SELECTION',
          promptKey: 'appointment-dates-menu',
          action: 'PLAY_AND_WAIT',
          selectedHospitalId: session.selectedHospitalId,
          selectedHospital: session.selectedHospital,
          language: session.language ?? 'en',
          intent: 'FIND_HOSPITAL',
        };
      }

      if (event.digits === '2') {
        // Change hospital selection -> Return to hospital options menu
        return {
          nextState: 'HOSPITAL_SELECTION',
          promptKey: 'hospital-options-menu',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
          intent: 'FIND_HOSPITAL',
        };
      }

      // Invalid confirmation digit
      const attempts = session.attemptCounters.hospitalConfirmation + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        const promptKey = session.selectedHospital ? 'hospital-confirm-1' : 'invalid';
        return {
          nextState: 'HOSPITAL_CONFIRMATION',
          promptKey,
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'goodbye',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max confirmation attempts exceeded',
      };
    }

    if (event.type === 'TIMEOUT') {
      const attempts = session.attemptCounters.hospitalConfirmation + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        const promptKey = session.selectedHospital ? 'hospital-confirm-1' : 'timeout';
        return {
          nextState: 'HOSPITAL_CONFIRMATION',
          promptKey,
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'goodbye',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max confirmation timeouts exceeded',
      };
    }

    return {
      nextState: 'HOSPITAL_CONFIRMATION',
      promptKey: 'hospital-confirm-1',
      action: 'PLAY_AND_WAIT',
      language: session.language ?? 'en',
    };
  }

  private handleAppointmentDateSelection(session: IVRSession, event: IVREvent): TransitionResult {
    const dates = session.availableDates ?? [];
    const count = dates.length;

    if (event.type === 'DTMF_RECEIVED' && event.digits) {
      const idx = parseInt(event.digits, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= count) {
        const selectedDate = dates[idx - 1];
        return {
          nextState: 'APPOINTMENT_SLOT_SELECTION',
          promptKey: 'appointment-slots-menu',
          action: 'PLAY_AND_WAIT',
          selectedAppointmentDate: selectedDate,
          language: session.language ?? 'en',
          intent: 'FIND_HOSPITAL',
        };
      }

      // Invalid date choice
      const attempts = session.attemptCounters.appointmentDate + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'APPOINTMENT_DATE_SELECTION',
          promptKey: 'appointment-invalid-date',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'appointment-max-attempts',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max appointment date selection attempts exceeded',
      };
    }

    if (event.type === 'TIMEOUT') {
      const attempts = session.attemptCounters.appointmentDate + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'APPOINTMENT_DATE_SELECTION',
          promptKey: 'appointment-timeout',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'appointment-max-attempts',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max appointment date timeouts exceeded',
      };
    }

    return {
      nextState: 'APPOINTMENT_DATE_SELECTION',
      promptKey: 'appointment-dates-menu',
      action: 'PLAY_AND_WAIT',
      language: session.language ?? 'en',
    };
  }

  private handleAppointmentSlotSelection(session: IVRSession, event: IVREvent): TransitionResult {
    const slots = session.availableSlots ?? [];
    const count = slots.length;

    if (event.type === 'DTMF_RECEIVED' && event.digits) {
      const idx = parseInt(event.digits, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= count) {
        const selectedSlot = slots[idx - 1];
        return {
          nextState: 'SLOT_CONFIRMATION',
          promptKey: 'appointment-confirm-slot',
          action: 'PLAY_AND_WAIT',
          selectedSlotId: selectedSlot.id,
          selectedSlot: selectedSlot,
          language: session.language ?? 'en',
          intent: 'FIND_HOSPITAL',
        };
      }

      // Invalid slot choice
      const attempts = session.attemptCounters.appointmentSlot + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'APPOINTMENT_SLOT_SELECTION',
          promptKey: 'appointment-invalid-slot',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'appointment-max-attempts',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max appointment slot selection attempts exceeded',
      };
    }

    if (event.type === 'TIMEOUT') {
      const attempts = session.attemptCounters.appointmentSlot + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'APPOINTMENT_SLOT_SELECTION',
          promptKey: 'appointment-timeout',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'appointment-max-attempts',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max appointment slot timeouts exceeded',
      };
    }

    return {
      nextState: 'APPOINTMENT_SLOT_SELECTION',
      promptKey: 'appointment-slots-menu',
      action: 'PLAY_AND_WAIT',
      language: session.language ?? 'en',
    };
  }

  private handleSlotConfirmation(session: IVRSession, event: IVREvent): TransitionResult {
    if (event.type === 'DTMF_RECEIVED' && event.digits) {
      if (event.digits === '1') {
        // Confirmed slot choice -> Advances to BOOKING_CONFIRMED with SMS confirmation
        return {
          nextState: 'BOOKING_CONFIRMED',
          promptKey: 'booking-confirmed-sms-sent',
          action: 'PLAY_AND_HANGUP',
          selectedHospitalId: session.selectedHospitalId,
          selectedAppointmentDate: session.selectedAppointmentDate,
          selectedSlotId: session.selectedSlotId,
          selectedSlot: session.selectedSlot,
          language: session.language ?? 'en',
          intent: 'FIND_HOSPITAL',
        };
      }

      if (event.digits === '2') {
        // Change slot choice -> Returns to APPOINTMENT_SLOT_SELECTION
        return {
          nextState: 'APPOINTMENT_SLOT_SELECTION',
          promptKey: 'appointment-slots-menu',
          action: 'PLAY_AND_WAIT',
          selectedAppointmentDate: session.selectedAppointmentDate,
          language: session.language ?? 'en',
          intent: 'FIND_HOSPITAL',
        };
      }

      // Invalid slot confirmation digit
      const attempts = session.attemptCounters.slotConfirmation + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'SLOT_CONFIRMATION',
          promptKey: 'appointment-confirm-slot',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'appointment-max-attempts',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max slot confirmation attempts exceeded',
      };
    }

    if (event.type === 'TIMEOUT') {
      const attempts = session.attemptCounters.slotConfirmation + 1;
      if (attempts < IVRStateMachine.MAX_ATTEMPTS) {
        return {
          nextState: 'SLOT_CONFIRMATION',
          promptKey: 'appointment-confirm-slot',
          action: 'PLAY_AND_WAIT',
          language: session.language ?? 'en',
        };
      }

      return {
        nextState: 'FAILED',
        promptKey: 'appointment-max-attempts',
        action: 'PLAY_AND_HANGUP',
        language: session.language ?? 'en',
        error: 'Max slot confirmation timeouts exceeded',
      };
    }

    return {
      nextState: 'SLOT_CONFIRMATION',
      promptKey: 'appointment-confirm-slot',
      action: 'PLAY_AND_WAIT',
      language: session.language ?? 'en',
    };
  }

  private handlePlaceholderState(_session: IVRSession, event: IVREvent): TransitionResult {
    if (event.type === 'PLAYBACK_FINISHED' || event.type === 'TIMEOUT') {
      return {
        nextState: 'COMPLETED',
        promptKey: null,
        action: 'HANGUP',
      };
    }

    return {
      nextState: 'COMPLETED',
      promptKey: null,
      action: 'HANGUP',
    };
  }
}
