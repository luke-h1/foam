import type { ParsedPart } from '@app/utils/chat/parsed-part';

import { applyMentionLoginCasing } from '../apply-mention-login-casing';
import { clearMentionLoginIndex } from '../clear-mention-login-index';
import { registerMentionLogin } from '../register-mention-login';

describe('applyMentionLoginCasing', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('applyMentionLoginCasing rewrites mention parts when canonical login is known', () => {
    registerMentionLogin('VelvetFathom93');

    const parts = applyMentionLoginCasing([
      { type: 'mention', content: '@velvetfathom93' },
      { type: 'text', content: ' high hopes' },
    ]);

    expect(parts[0]).toEqual<ParsedPart>({
      type: 'mention',
      content: '@VelvetFathom93',
    });
  });
});
