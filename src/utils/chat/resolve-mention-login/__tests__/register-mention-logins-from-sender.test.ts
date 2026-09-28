import { clearMentionLoginIndex } from '../clear-mention-login-index';
import { formatMentionContent } from '../format-mention-content';
import { getMentionLogin } from '../get-mention-login';
import { registerMentionLoginsFromSender } from '../register-mention-logins-from-sender';

describe('registerMentionLoginsFromSender', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('registers display names that match login casing', () => {
    registerMentionLoginsFromSender('velvetfathom93', 'VelvetFathom93');

    expect(getMentionLogin('velvetfathom93')).toBe('VelvetFathom93');
    expect(formatMentionContent('@velvetfathom93')).toBe('@VelvetFathom93');
  });
});
