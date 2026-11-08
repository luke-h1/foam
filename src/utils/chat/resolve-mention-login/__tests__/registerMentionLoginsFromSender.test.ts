import { clearMentionIndexes } from '../clearMentionIndexes';
import { formatMentionContent } from '../formatMentionContent';
import { getMentionLogin } from '../getMentionLogin';
import { registerMentionLoginsFromSender } from '../registerMentionLoginsFromSender';

describe('registerMentionLoginsFromSender', () => {
  beforeEach(() => {
    clearMentionIndexes();
  });

  test('registers display names that match login casing', () => {
    registerMentionLoginsFromSender('velvetfathom93', 'VelvetFathom93');

    expect(getMentionLogin('velvetfathom93')).toBe('VelvetFathom93');

    expect(formatMentionContent('@velvetfathom93')).toBe('@VelvetFathom93');
  });
});
