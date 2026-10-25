import type { MessageToken } from '@app/utils/chat/messageToken';

import { applyMentionLoginCasing } from '../applyMentionLoginCasing';
import { clearMentionLoginIndex } from '../clearMentionLoginIndex';
import { registerMentionLogin } from '../registerMentionLogin';

describe('applyMentionLoginCasing', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
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
