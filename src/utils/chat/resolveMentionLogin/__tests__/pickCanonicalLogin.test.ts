import { clearMentionLoginIndex } from '../clearMentionLoginIndex';
import { pickCanonicalLogin } from '../pickCanonicalLogin';

describe('pickCanonicalLogin', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('prefers login strings that preserve Twitch casing', () => {
    expect(pickCanonicalLogin('bunglexo', 'BungleXO')).toBe('BungleXO');
    expect(pickCanonicalLogin('BungleXO', 'bunglexo')).toBe('BungleXO');
  });
});
