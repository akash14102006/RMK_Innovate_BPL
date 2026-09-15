import { describe, it, expect, beforeEach } from 'vitest';
import { IVRSessionService } from '../../../src/modules/ivr/session/IVRSessionService.js';
import { InMemoryIVRSessionStore } from '../../../src/modules/ivr/session/IVRSessionStore.js';
import { IVRErrorCode } from '../../../src/modules/ivr/errors/IVRError.js';

describe('IVRSessionService — Session Lifecycle & Isolation', () => {
  let store: InMemoryIVRSessionStore;
  let service: IVRSessionService;

  beforeEach(() => {
    store = new InMemoryIVRSessionStore();
    service = new IVRSessionService(store, 60000); // 1 min TTL
  });

  it('creates and returns a new IVR session with default initial state', async () => {
    const session = await service.createSession({
      callId: 'call-001',
      channelId: 'PJSIP/1001-001',
      callerNumber: '+919876543210',
    });

    expect(session.sessionId).toBeDefined();
    expect(session.callId).toBe('call-001');
    expect(session.channelId).toBe('PJSIP/1001-001');
    expect(session.state).toBe('CALL_RECEIVED');
    expect(session.language).toBeNull();
    expect(session.intent).toBe('NONE');
    expect(session.attemptCounters.language).toBe(0);
    expect(session.attemptCounters.menu).toBe(0);
  });

  it('guarantees complete state isolation between concurrent calls', async () => {
    const sessionA = await service.createSession({
      callId: 'call-AAA',
      channelId: 'PJSIP/1001-AAA',
    });

    const sessionB = await service.createSession({
      callId: 'call-BBB',
      channelId: 'PJSIP/1001-BBB',
    });

    // Mutate Session A
    sessionA.language = 'ta';
    sessionA.state = 'MAIN_MENU';
    await service.updateSession(sessionA);

    // Mutate Session B
    sessionB.language = 'en';
    sessionB.state = 'FIND_HOSPITAL';
    await service.updateSession(sessionB);

    // Retrieve again from store
    const retrievedA = await service.getSessionByCallId('call-AAA');
    const retrievedB = await service.getSessionByCallId('call-BBB');

    expect(retrievedA.language).toBe('ta');
    expect(retrievedA.state).toBe('MAIN_MENU');

    expect(retrievedB.language).toBe('en');
    expect(retrievedB.state).toBe('FIND_HOSPITAL');
  });

  it('terminates session cleanly upon call hangup', async () => {
    await service.createSession({
      callId: 'call-terminate',
      channelId: 'PJSIP/1001-term',
    });

    const terminated = await service.terminateSession('call-terminate');
    expect(terminated?.state).toBe('TERMINATED');

    const fetched = await service.getSessionByCallId('call-terminate');
    expect(fetched.state).toBe('TERMINATED');
  });

  it('throws SESSION_NOT_FOUND when querying unknown callId', async () => {
    await expect(service.getSessionByCallId('non-existent-call')).rejects.toThrowError();
    try {
      await service.getSessionByCallId('non-existent-call');
    } catch (err: any) {
      expect(err.code).toBe(IVRErrorCode.SESSION_NOT_FOUND);
    }
  });

  it('expires old sessions based on TTL', async () => {
    const shortTtlService = new IVRSessionService(store, 10); // 10ms TTL
    const session = await shortTtlService.createSession({
      callId: 'call-expire',
      channelId: 'PJSIP/1001-exp',
    });

    await new Promise((r) => setTimeout(r, 25));

    await expect(shortTtlService.getSession(session.sessionId)).rejects.toThrowError();
  });
});
