import SecureStoreService from './secureStore';
import type { ProfileDraft, ProfileStepId } from '../types/profile';
import { createDefaultProfileDraft } from '../types/profile';

const DRAFT_KEY_PREFIX = 'bharat_pulselink_profile_draft_v1_';

export class ProfileDraftService {
  private static activeMemoryDraft: ProfileDraft | null = null;

  /**
   * Get draft storage key isolated by user ID session
   */
  private static getStorageKey(userId: string): string {
    const safeUserId = userId ? userId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') : 'guest_user';
    return `${DRAFT_KEY_PREFIX}${safeUserId}`;
  }

  /**
   * Load or initialize an encrypted account-bound profile draft
   */
  public static async loadDraft(userId: string = 'guest_user', defaultPhone: string = ''): Promise<ProfileDraft> {
    try {
      const key = this.getStorageKey(userId);
      console.log(`[PROFILE_DRAFT] LOADING_DRAFT { userId: '${userId}' }`);

      const rawJson = await SecureStoreService.get(key);
      if (rawJson) {
        const parsed = JSON.parse(rawJson) as ProfileDraft;
        if (parsed && parsed.userId === userId && parsed.version === 1) {
          console.log(`[PROFILE_DRAFT] DRAFT_RECOVERED { userId: '${userId}', isComplete: ${parsed.isComplete} }`);
          this.activeMemoryDraft = parsed;
          return parsed;
        }
      }

      console.log(`[PROFILE_DRAFT] INITIALIZING_NEW_DRAFT { userId: '${userId}' }`);
      const newDraft = createDefaultProfileDraft(userId, defaultPhone);
      await this.saveDraft(newDraft);
      return newDraft;
    } catch (err: any) {
      console.log(`[PROFILE_DRAFT] LOAD_ERROR { message: '${err?.message}' }`);
      const fallback = createDefaultProfileDraft(userId, defaultPhone);
      this.activeMemoryDraft = fallback;
      return fallback;
    }
  }

  /**
   * Save active profile draft to encrypted account-bound local storage
   */
  public static async saveDraft(draft: ProfileDraft): Promise<void> {
    try {
      draft.updatedAtISO = new Date().toISOString();
      this.activeMemoryDraft = draft;

      const key = this.getStorageKey(draft.userId);
      const rawJson = JSON.stringify(draft);
      await SecureStoreService.set(key, rawJson);
      console.log(`[PROFILE_DRAFT] DRAFT_SAVED { userId: '${draft.userId}', completedSteps: ${draft.completedStepIds.length} }`);
    } catch (err: any) {
      console.log(`[PROFILE_DRAFT] SAVE_ERROR { message: '${err?.message}' }`);
      throw new Error('Failed to save profile draft securely to local device.');
    }
  }

  /**
   * Mark a specific step ID as completed in the draft
   */
  public static async markStepCompleted(stepId: ProfileStepId): Promise<ProfileDraft> {
    if (!this.activeMemoryDraft) {
      throw new Error('No active profile draft loaded.');
    }

    if (!this.activeMemoryDraft.completedStepIds.includes(stepId)) {
      this.activeMemoryDraft.completedStepIds.push(stepId);
    }

    await this.saveDraft(this.activeMemoryDraft);
    return this.activeMemoryDraft;
  }

  /**
   * Mark full profile complete after server acceptance
   */
  public static async markProfileCompleted(): Promise<ProfileDraft> {
    if (!this.activeMemoryDraft) {
      throw new Error('No active profile draft loaded.');
    }

    this.activeMemoryDraft.isComplete = true;
    await this.saveDraft(this.activeMemoryDraft);
    console.log(`[PROFILE_DRAFT] PROFILE_MARKED_COMPLETE { userId: '${this.activeMemoryDraft.userId}' }`);
    return this.activeMemoryDraft;
  }

  /**
   * Reset / clear profile draft on user logout or complete reset
   */
  public static async clearDraft(userId: string): Promise<void> {
    try {
      const key = this.getStorageKey(userId);
      await SecureStoreService.remove(key);
      if (this.activeMemoryDraft?.userId === userId) {
        this.activeMemoryDraft = null;
      }
      console.log(`[PROFILE_DRAFT] DRAFT_CLEARED { userId: '${userId}' }`);
    } catch (err: any) {
      console.log(`[PROFILE_DRAFT] CLEAR_ERROR { message: '${err?.message}' }`);
    }
  }

  /**
   * Get memory draft snapshot synchronously if available
   */
  public static getActiveMemoryDraft(): ProfileDraft | null {
    return this.activeMemoryDraft;
  }
}

export default ProfileDraftService;
