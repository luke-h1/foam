import type { MessageToken } from '@app/utils/chat/message-token';

import { applyMentionLoginCasing } from '../apply-mention-login-casing';
import { clearMentionLoginIndex } from '../clear-mention-login-index';
import { registerMentionLogin } from '../register-mention-login';

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
