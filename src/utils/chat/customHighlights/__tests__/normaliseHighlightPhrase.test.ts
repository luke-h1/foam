import { normaliseHighlightPhrase } from '../normaliseHighlightPhrase';

describe('normaliseHighlightPhrase', () => {
  test('trims and lowercases', () => {
    expect(normaliseHighlightPhrase('  PogChamp  ')).toEqual('pogchamp');
  });
});
