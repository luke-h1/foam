import type { MessageToken } from '@app/types/chat/messageToken';

import { applyMentionLoginCasing } from '../applyMentionLoginCasing';
import { clearMentionIndexes } from '../clearMentionIndexes';
import { registerMentionLogin } from '../registerMentionLogin';

describe('applyMentionLoginCasing', () => {
  beforeEach(() => {
    clearMentionIndexes();
  });

  test('applyMentionLoginCasing rewrites mention tokens when canonical login is known', () => {
    registerMentionLogin('VelvetFathom93');

    const tokens = applyMentionLoginCasing([
      { type: 'mention', content: '@velvetfathom93' },
      { type: 'text', content: ' high hopes' },
    ]);

    expect(tokens[0]).toEqual<MessageToken>({
      type: 'mention',
      content: '@VelvetFathom93',
    });
  });
});
