import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

import {
  findCustomHighlight,
  normaliseHighlightPhrase,
} from '../customHighlights';

const rules = [
  { id: '1', phrase: 'pog', color: '#facc15' },
  { id: '2', phrase: 'drop a follow', color: '#38bdf8' },
];

function textMessage(content: string): ParsedPart[] {
  return [{ type: 'text', content }];
}

describe('normaliseHighlightPhrase', () => {
  test('trims and lowercases', () => {
    expect(normaliseHighlightPhrase('  PogChamp  ')).toEqual('pogchamp');
  });
});

describe('findCustomHighlight', () => {
  test('matches case-insensitively against message text', () => {
    expect(findCustomHighlight(textMessage('that was POG'), rules)).toEqual(
      rules[0],
    );
  });

  test('returns the first matching rule', () => {
    expect(
      findCustomHighlight(textMessage('pog, drop a follow'), rules),
    ).toEqual(rules[0]);
  });

  test('matches text across emote boundaries', () => {
    const message: ParsedPart[] = [
      { type: 'text', content: 'drop a ' },
      { type: 'text', content: 'follow please' },
    ];
    expect(findCustomHighlight(message, rules)).toEqual(rules[1]);
  });

  test('returns undefined when nothing matches', () => {
    expect(findCustomHighlight(textMessage('hello chat'), rules)).toEqual(
      undefined,
    );
  });

  test('returns undefined for empty rules or message', () => {
    expect(findCustomHighlight(textMessage('pog'), [])).toEqual(undefined);
    expect(findCustomHighlight([], rules)).toEqual(undefined);
  });

  test('invalidates the cached match when the rules change', () => {
    const message = textMessage('pog');
    expect(findCustomHighlight(message, rules)).toEqual(rules[0]);

    const nextRules = [{ id: '3', phrase: 'nothing', color: '#f87171' }];
    expect(findCustomHighlight(message, nextRules)).toEqual(undefined);
  });
});
