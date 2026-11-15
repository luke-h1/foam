import { measureFunction } from 'reassure';

import { resetMentionLogins } from '@app/store/chat/actions/mention-login-lookup';
import { registerMentionChatter } from '@app/utils/chat/resolve-mention-login/registerMentionChatter';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/registerMentionLogin';
import { searchMentionChatters } from '@app/utils/chat/resolve-mention-login/searchMentionChatters';

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

function seedIndexes(): void {
  resetMentionLogins();

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
