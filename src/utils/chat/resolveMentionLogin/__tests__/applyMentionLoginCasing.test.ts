import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { applyMentionLoginCasing } from '../applyMentionLoginCasing';
import { clearMentionLoginIndex } from '../clearMentionLoginIndex';
import { registerMentionLogin } from '../registerMentionLogin';

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
