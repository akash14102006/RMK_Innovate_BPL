/**
 * Bharat PulseLink — Asterisk Adapter Layer
 *
 * Provides abstraction between application logic and telephony protocol.
 * Enables both headless testing and production Asterisk connectivity.
 */

export interface IAsteriskAdapter {
  answerCall(channelId: string): Promise<boolean>;
  playPrompt(channelId: string, promptPath: string): Promise<boolean>;
  playPromptAndCollect(channelId: string, promptPath: string, maxDigits?: number, timeoutSec?: number): Promise<boolean>;
  hangup(channelId: string): Promise<boolean>;
  stopPlayback(channelId: string): Promise<boolean>;
}

export interface MockTelephonyCallRecord {
  channelId: string;
  answered: boolean;
  playedPrompts: string[];
  hungup: boolean;
}

export class MockAsteriskAdapter implements IAsteriskAdapter {
  public readonly calls: Map<string, MockTelephonyCallRecord> = new Map();

  private getOrCreate(channelId: string): MockTelephonyCallRecord {
    let rec = this.calls.get(channelId);
    if (!rec) {
      rec = {
        channelId,
        answered: false,
        playedPrompts: [],
        hungup: false,
      };
      this.calls.set(channelId, rec);
    }
    return rec;
  }

  public async answerCall(channelId: string): Promise<boolean> {
    const rec = this.getOrCreate(channelId);
    rec.answered = true;
    return true;
  }

  public async playPrompt(channelId: string, promptPath: string): Promise<boolean> {
    const rec = this.getOrCreate(channelId);
    rec.playedPrompts.push(promptPath);
    return true;
  }

  public async playPromptAndCollect(
    channelId: string,
    promptPath: string,
    _maxDigits: number = 1,
    _timeoutSec: number = 5,
  ): Promise<boolean> {
    const rec = this.getOrCreate(channelId);
    rec.playedPrompts.push(promptPath);
    return true;
  }

  public async hangup(channelId: string): Promise<boolean> {
    const rec = this.getOrCreate(channelId);
    rec.hungup = true;
    return true;
  }

  public async stopPlayback(_channelId: string): Promise<boolean> {
    return true;
  }

  public getCallHistory(channelId: string): MockTelephonyCallRecord | undefined {
    return this.calls.get(channelId);
  }

  public clear(): void {
    this.calls.clear();
  }
}
