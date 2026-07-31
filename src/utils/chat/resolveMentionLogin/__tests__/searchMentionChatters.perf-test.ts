import { measureFunction } from 'reassure';

import { clearMentionLoginIndex } from '@app/utils/chat/resolveMentionLogin/clearMentionLoginIndex';
import { registerMentionChatter } from '@app/utils/chat/resolveMentionLogin/registerMentionChatter';
import { registerMentionLogin } from '@app/utils/chat/resolveMentionLogin/registerMentionLogin';
import { searchMentionChatters } from '@app/utils/chat/resolveMentionLogin/searchMentionChatters';

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

/**
 * `capMentionIndex` holds 8000 entries per index, so a long session in a busy
 * channel fills both. Chatters carry a colour; the login-only index does not,
 * which is the half that has to synthesise one per match.
 */
function seedIndexes(): void {
  clearMentionLoginIndex();

  for (let i = 0; i < 4000; i += 1) {
    registerMentionChatter({
      login: `Chatter${i}`,
      userId: `user-${i}`,
      color: '#FF7F50',
    });
    registerMentionLogin(`Lurker${i}`);
  }
}

seedIndexes();

/**
 * A single leading character matches nearly the whole index, which is the worst
 * case and also the first keystroke of every mention the user types.
 */
describe('searchMentionChatters performance', () => {
  test('searches a broad single-character query', async () => {
    await measureFunction(() => {
      searchMentionChatters('c');
    }, MEASURE_OPTIONS);
  });

  test('types a mention one character at a time', async () => {
    await measureFunction(() => {
      for (const query of ['c', 'ch', 'cha', 'chat', 'chatt']) {
        searchMentionChatters(query);
      }
    }, MEASURE_OPTIONS);
  });
});
