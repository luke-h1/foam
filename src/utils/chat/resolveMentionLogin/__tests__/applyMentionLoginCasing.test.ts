import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { applyMentionLoginCasing } from '../applyMentionLoginCasing';
import { clearMentionLoginIndex } from '../clearMentionLoginIndex';
import { registerMentionLogin } from '../registerMentionLogin';

describe('applyMentionLoginCasing', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('applyMentionLoginCasing rewrites mention parts when canonical login is known', () => {
    registerMentionLogin('BungleXO');

    const parts = applyMentionLoginCasing([
      { type: 'mention', content: '@bunglexo' },
      { type: 'text', content: ' high hopes' },
    ]);

    expect(parts[0]).toEqual<ParsedPart>({
      type: 'mention',
      content: '@BungleXO',
    });
  });
});
