import {
  deriveChatBody,
  getMessageStructure,
} from '@app/utils/chat/deriveChatBody';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

const text = (content: string): ParsedPart => ({ type: 'text', content });
const mention = (content: string): ParsedPart => ({ type: 'mention', content });
const link = (content: string): ParsedPart => ({ type: 'link', content });
const emote = (name: string, zeroWidth = false): ParsedPart => ({
  type: 'emote',
  content: name,
  name,
  zero_width: zeroWidth,
});
const ritual = (): ParsedPart => ({
  type: 'ritual',
  displayName: 'forsen',
  ritualName: 'new_chatter',
  systemMsg: 'forsen is new here',
});

describe('getMessageStructure', () => {
  test('treats text, mention, link and non-zero-width emotes as inline', () => {
    const message = [text('hello '), mention('@forsen'), link('https://x.y')];

    expect(getMessageStructure(message)).toEqual({
      canBeInline: true,
      containsEmotes: false,
    });
  });

  test('flags emote presence and keeps a plain emote inline', () => {
    const message = [text('nice '), emote('Kappa')];

    expect(getMessageStructure(message)).toEqual({
      canBeInline: true,
      containsEmotes: true,
    });
  });

  test('a zero-width emote breaks inline flow', () => {
    const message = [emote('Kappa'), emote('RainTime', true)];

    expect(getMessageStructure(message)).toEqual({
      canBeInline: false,
      containsEmotes: true,
    });
  });

  test('a notice part is not inlineable', () => {
    const message = [ritual()];

    expect(getMessageStructure(message)).toEqual({
      canBeInline: false,
      containsEmotes: false,
    });
  });

  test('returns the cached reference for the same parts array', () => {
    const message = [text('cached')];

    expect(getMessageStructure(message)).toBe(getMessageStructure(message));
  });
});

describe('deriveChatBody', () => {
  test('collects normalised mention logins', () => {
    const message = [mention('@Forsen'), text(' and '), mention('NymN')];

    expect(deriveChatBody(message).mentionLogins).toEqual(['forsen', 'nymn']);
  });

  test('resolves variant from flags before scanning content', () => {
    const message = [text('hi')];

    expect(deriveChatBody(message, { isAnnouncement: true }).variant).toBe(
      'announcement',
    );
    expect(
      deriveChatBody([text('hi again')], { isTwitchSystemNotice: true })
        .variant,
    ).toBe('twitch_system_notice');
    expect(deriveChatBody([text('sys')], { sender: 'System' }).variant).toBe(
      'app_system_sender',
    );
  });

  test('detects notice variants from parts', () => {
    expect(deriveChatBody([ritual()]).variant).toBe('ritual');
  });

  test('defaults to user_chat', () => {
    expect(deriveChatBody([text('gg'), emote('Kappa')]).variant).toBe(
      'user_chat',
    );
  });

  test('memoises the derived descriptor per parts array', () => {
    const message = [text('memo')];

    expect(deriveChatBody(message)).toBe(deriveChatBody(message));
  });
});
