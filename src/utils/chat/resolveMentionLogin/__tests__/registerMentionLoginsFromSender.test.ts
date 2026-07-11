import { clearMentionLoginIndex } from '../clearMentionLoginIndex';
import { formatMentionContent } from '../formatMentionContent';
import { getMentionLogin } from '../getMentionLogin';
import { registerMentionLoginsFromSender } from '../registerMentionLoginsFromSender';

describe('registerMentionLoginsFromSender', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('registers display names that match login casing', () => {
    registerMentionLoginsFromSender('bunglexo', 'BungleXO');

    expect(getMentionLogin('bunglexo')).toBe('BungleXO');
    expect(formatMentionContent('@bunglexo')).toBe('@BungleXO');
  });
});
