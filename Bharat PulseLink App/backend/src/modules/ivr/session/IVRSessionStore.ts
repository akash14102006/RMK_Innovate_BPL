/**
 * Bharat PulseLink — IVR Session Store
 *
 * In-memory thread-safe session repository with TTL enforcement and indexing.
 * Ensures zero cross-call state leakage.
 */

import { type IVRSession } from '../ivr.types.js';

export interface IIVRSessionStore {
  save(session: IVRSession): Promise<void>;
  findById(sessionId: string): Promise<IVRSession | null>;
  findByCallId(callId: string): Promise<IVRSession | null>;
  findByChannelId(channelId: string): Promise<IVRSession | null>;
  delete(sessionId: string): Promise<boolean>;
  cleanupExpired(): Promise<number>;
  clear(): Promise<void>;
  count(): Promise<number>;
}

export class InMemoryIVRSessionStore implements IIVRSessionStore {
  private readonly sessions: Map<string, IVRSession> = new Map();
  private readonly callIdIndex: Map<string, string> = new Map();
  private readonly channelIdIndex: Map<string, string> = new Map();

  public async save(session: IVRSession): Promise<void> {
    this.sessions.set(session.sessionId, { ...session });
    this.callIdIndex.set(session.callId, session.sessionId);
    if (session.channelId) {
      this.channelIdIndex.set(session.channelId, session.sessionId);
    }
  }

  public async findById(sessionId: string): Promise<IVRSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.delete(sessionId);
      return null;
    }
    return { ...session };
  }

  public async findByCallId(callId: string): Promise<IVRSession | null> {
    const sessionId = this.callIdIndex.get(callId);
    if (!sessionId) return null;
    return this.findById(sessionId);
  }

  public async findByChannelId(channelId: string): Promise<IVRSession | null> {
    const sessionId = this.channelIdIndex.get(channelId);
    if (!sessionId) return null;
    return this.findById(sessionId);
  }

  public async delete(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    this.callIdIndex.delete(session.callId);
    if (session.channelId) {
      this.channelIdIndex.delete(session.channelId);
    }
    return this.sessions.delete(sessionId);
  }

  public async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt.getTime() <= now) {
        await this.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  public async clear(): Promise<void> {
    this.sessions.clear();
    this.callIdIndex.clear();
    this.channelIdIndex.clear();
  }

  public async count(): Promise<number> {
    return this.sessions.size;
  }
}
