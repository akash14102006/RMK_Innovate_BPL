/**
 * Bharat PulseLink — IVR Session Service
 *
 * Manages creation, lifecycle updates, and isolation of IVR sessions.
 */

import { uuidv7 } from 'uuidv7';
import { type IVRSession } from '../ivr.types.js';
import { type IIVRSessionStore, InMemoryIVRSessionStore } from './IVRSessionStore.js';
import { IVRError, IVRErrorCode } from '../errors/IVRError.js';

export class IVRSessionService {
  private readonly store: IIVRSessionStore;
  private readonly ttlMs: number;

  constructor(store?: IIVRSessionStore, ttlMs: number = 15 * 60 * 1000) {
    this.store = store ?? new InMemoryIVRSessionStore();
    this.ttlMs = ttlMs;
  }

  /**
   * Creates a new IVR session for an incoming call.
   */
  public async createSession(params: {
    callId: string;
    channelId: string;
    callerNumber?: string;
    metadata?: Record<string, unknown>;
  }): Promise<IVRSession> {
    const existing = await this.store.findByCallId(params.callId);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const session: IVRSession = {
      sessionId: uuidv7(),
      callId: params.callId,
      channelId: params.channelId,
      callerNumber: params.callerNumber,
      language: null,
      state: 'CALL_RECEIVED',
      intent: 'NONE',
      attemptCounters: {
        language: 0,
        menu: 0,
        pincode: 0,
        hospitalSelection: 0,
        hospitalConfirmation: 0,
        appointmentDate: 0,
        appointmentSlot: 0,
        slotConfirmation: 0,
      },
      metadata: params.metadata ?? {},
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + this.ttlMs),
    };

    await this.store.save(session);
    return session;
  }

  /**
   * Retrieves session by callId.
   */
  public async getSessionByCallId(callId: string): Promise<IVRSession> {
    const session = await this.store.findByCallId(callId);
    if (!session) {
      throw new IVRError({
        code: IVRErrorCode.SESSION_NOT_FOUND,
        message: `IVR session not found for callId: ${callId}`,
        statusCode: 404,
      });
    }
    return session;
  }

  /**
   * Retrieves session by sessionId.
   */
  public async getSession(sessionId: string): Promise<IVRSession> {
    const session = await this.store.findById(sessionId);
    if (!session) {
      throw new IVRError({
        code: IVRErrorCode.SESSION_NOT_FOUND,
        message: `IVR session not found for sessionId: ${sessionId}`,
        statusCode: 404,
      });
    }
    return session;
  }

  /**
   * Updates session fields.
   */
  public async updateSession(session: IVRSession): Promise<IVRSession> {
    const now = new Date();
    const updated: IVRSession = {
      ...session,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + this.ttlMs),
    };
    await this.store.save(updated);
    return updated;
  }

  /**
   * Terminates session and cleans resources.
   */
  public async terminateSession(callId: string): Promise<IVRSession | null> {
    const session = await this.store.findByCallId(callId);
    if (!session) return null;

    const terminated: IVRSession = {
      ...session,
      state: 'TERMINATED',
      updatedAt: new Date(),
    };
    await this.store.save(terminated);
    return terminated;
  }

  /**
   * Returns active sessions count.
   */
  public async getActiveCount(): Promise<number> {
    return this.store.count();
  }
}
