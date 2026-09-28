import { clearMentionLoginIndex } from '../clear-mention-login-index';
import { pickCanonicalLogin } from '../pick-canonical-login';

describe('pickCanonicalLogin', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('prefers login strings that preserve Twitch casing', () => {
    expect(pickCanonicalLogin('velvetfathom93', 'VelvetFathom93')).toBe(
      'VelvetFathom93',
    );
    expect(pickCanonicalLogin('VelvetFathom93', 'velvetfathom93')).toBe(
      'VelvetFathom93',
    );
  });
});
