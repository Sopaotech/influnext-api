import { shouldTriggerInstagramPostSyncAI } from '../src/utils/instagram-post-sync-ai-policy';

describe('Instagram post-sync AI policy', () => {
  it('keeps existing opt-in behavior for direct user actions by default', () => {
    expect(shouldTriggerInstagramPostSyncAI('post_oauth', undefined)).toBe(true);
    expect(shouldTriggerInstagramPostSyncAI('manual_retry', undefined)).toBe(true);
  });

  it('never triggers AI for scheduled synchronization', () => {
    expect(shouldTriggerInstagramPostSyncAI('scheduled', undefined)).toBe(false);
  });

  it('allows the isolated test environment to disable all post-sync AI hooks', () => {
    expect(shouldTriggerInstagramPostSyncAI('post_oauth', 'false')).toBe(false);
    expect(shouldTriggerInstagramPostSyncAI('manual_retry', 'false')).toBe(false);
  });
});
