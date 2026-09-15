/**
 * Bharat PulseLink — IVR Menu Service
 *
 * Central data-driven menu definitions and DTMF routing rules.
 */

import { type IVRMenuItem, type IVRIntent, type IVRState } from '../ivr.types.js';

export class IVRMenuService {
  private static readonly MAIN_MENU_ITEMS: Record<string, IVRMenuItem> = {
    '1': {
      digit: '1',
      intent: 'FIND_HOSPITAL',
      targetState: 'FIND_HOSPITAL',
      description: 'Find a hospital',
    },
    '2': {
      digit: '2',
      intent: 'BOOK_APPOINTMENT',
      targetState: 'BOOK_APPOINTMENT',
      description: 'Book an appointment',
    },
    '3': {
      digit: '3',
      intent: 'EXISTING_APPOINTMENT',
      targetState: 'EXISTING_APPOINTMENT',
      description: 'Check existing appointment',
    },
    '4': {
      digit: '4',
      intent: 'EMERGENCY',
      targetState: 'EMERGENCY',
      description: 'Emergency help',
    },
  };

  /**
   * Resolves main menu option from DTMF digit.
   */
  public resolveMainMenuOption(digit: string): IVRMenuItem | null {
    const trimmed = digit.trim();
    return IVRMenuService.MAIN_MENU_ITEMS[trimmed] ?? null;
  }

  /**
   * Returns all main menu items.
   */
  public getMainMenuItems(): IVRMenuItem[] {
    return Object.values(IVRMenuService.MAIN_MENU_ITEMS);
  }
}
