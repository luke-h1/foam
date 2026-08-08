import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chatColorCaches';
import {
  invalidateBakedBadges,
  invalidateCosmeticsCache,
  invalidateMentionColors,
  invalidatePersonalEmotes,
} from '@app/store/chat/actions/invalidation';
import { chatStore$ } from '@app/store/chat/observables/chatStore';

describe('invalidation', () => {
  beforeEach(() => {
    chatStore$.mentionLoginRevision.set(0);
    chatStore$.cosmeticBindingsVersion.set(0);
    chatStore$.cosmeticsCacheVersion.set(0);
    chatStore$.personalEmotesVersion.set(0);
  });

  test('invalidateMentionColors bumps the revision and drops cached mention colours', () => {
    setSessionCacheString('mentionColors', 'luke', '#ff0000');

    invalidateMentionColors();

    expect(chatStore$.mentionLoginRevision.peek()).toBe(1);
    expect(getSessionCacheString('mentionColors', 'luke')).toBeUndefined();
  });

  test('invalidateBakedBadges bumps only the bindings version', () => {
    invalidateBakedBadges();

    expect(chatStore$.cosmeticBindingsVersion.peek()).toBe(1);
    expect(chatStore$.cosmeticsCacheVersion.peek()).toBe(0);
  });

  test('invalidateCosmeticsCache bumps only the cache version', () => {
    invalidateCosmeticsCache();

    expect(chatStore$.cosmeticsCacheVersion.peek()).toBe(1);
    expect(chatStore$.cosmeticBindingsVersion.peek()).toBe(0);
  });

  test('invalidatePersonalEmotes bumps the personal emotes version', () => {
    invalidatePersonalEmotes();

    expect(chatStore$.personalEmotesVersion.peek()).toBe(1);
  });
});
