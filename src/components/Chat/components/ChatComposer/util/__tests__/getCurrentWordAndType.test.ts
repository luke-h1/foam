import { getCurrentWordAndType } from '../getCurrentWordAndType';

test('detects a command when the message starts with a slash', () => {
  const text = '/timeout';
  expect(getCurrentWordAndType(text, text.length)).toEqual({
    word: '/timeout',
    start: 0,
    end: 8,
    type: 'command',
    searchTerm: 'timeout',
  });
});

test('does not detect a command when the slash is not the first word', () => {
  const text = 'hello /timeout';
  expect(getCurrentWordAndType(text, text.length)).toEqual({
    word: '/timeout',
    start: 6,
    end: 14,
    type: 'emote',
    searchTerm: '/timeout',
  });
});

test('detects a user mention', () => {
  const text = '@luke';
  expect(getCurrentWordAndType(text, text.length)).toEqual({
    word: '@luke',
    start: 0,
    end: 5,
    type: 'user',
    searchTerm: 'luke',
  });
});

test('detects an emote search for a plain word', () => {
  const text = 'Kappa';
  expect(getCurrentWordAndType(text, text.length)).toEqual({
    word: 'Kappa',
    start: 0,
    end: 5,
    type: 'emote',
    searchTerm: 'Kappa',
  });
});
