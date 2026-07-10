import type { MessageStructure } from '@app/utils/chat/deriveChatBody';
import {
  deriveChatBody,
  getMessageStructure,
} from '@app/utils/chat/deriveChatBody';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

const text = (content: string): ParsedPart => ({ type: 'text', content });
const mention = (content: string): ParsedPart => ({ type: 'mention', content });
const link = (content: string): ParsedPart => ({ type: 'link', content });
const emote = (name: string, zeroWidth = false): ParsedPart<'emote'> => ({
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
const raid = (): ParsedPart => ({
  type: 'raid',
  content: 'forsen is raiding with a party of 100',
});
const subscription = (): ParsedPart => ({
  type: 'sub',
  subscriptionEvent: {
    msgId: 'sub',
    displayName: 'forsen',
    plan: '1000',
  },
});
const charityDonation = (): ParsedPart => ({
  type: 'charitydonation',
  displayName: 'forsen',
  charityName: 'Save the Kappa',
  amount: '500',
  currency: 'USD',
  systemMsg: 'forsen donated $5.00',
});
const stvEmoteEvent = (): ParsedPart<'stv_emote_added'> => ({
  type: 'stv_emote_added',
  stvEvents: {
    type: 'added',
    data: {
      id: '123',
      name: 'FeelsDankMan',
      url: 'https://example.com/dank.png',
      original_name: 'FeelsDankMan',
      site: 'BTTV',
      creator: null,
      emote_link: '',
      width: 32,
      height: 32,
    },
  },
});
const viewerMilestone = (): ParsedPart => ({
  type: 'viewermilestone',
  category: 'watch-streak',
  reward: '',
  value: '20',
  content: '',
  systemMsg: 'forsen watched 20 consecutive streams',
  login: 'forsen',
  displayName: 'forsen',
});

describe('getMessageStructure', () => {
  test('treats text, mention, link and non-zero-width emotes as inline', () => {
    const message = [text('hello '), mention('@forsen'), link('https://x.y')];

    expect(getMessageStructure(message)).toEqual<MessageStructure>({
      canBeInline: true,
      containsEmotes: false,
    });
  });

  test('flags emote presence and keeps a plain emote inline', () => {
    const message = [text('nice '), emote('Kappa')];

    expect(getMessageStructure(message)).toEqual<MessageStructure>({
      canBeInline: true,
      containsEmotes: true,
    });
  });

  test('a zero-width emote breaks inline flow', () => {
    const message = [emote('Kappa'), emote('RainTime', true)];

    expect(getMessageStructure(message)).toEqual<MessageStructure>({
      canBeInline: false,
      containsEmotes: true,
    });
  });

  test('an emote carrying zero-width overlays breaks inline flow', () => {
    const base = emote('Kappa');
    base.overlaid = [emote('SoSnowy', true)];

    expect(getMessageStructure([text('gg '), base])).toEqual<MessageStructure>({
      canBeInline: false,
      containsEmotes: true,
    });
  });

  test('a notice part is not inlineable', () => {
    const message = [ritual()];

    expect(getMessageStructure(message)).toEqual<MessageStructure>({
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

  test('detects the subscription variant from a sub part', () => {
    expect(deriveChatBody([subscription()]).variant).toBe('subscription');
  });

  test('detects the charity_donation variant from a charity part', () => {
    expect(deriveChatBody([charityDonation()]).variant).toBe(
      'charity_donation',
    );
  });

  test('detects the stv_emote_event variant from an stv emote part', () => {
    expect(deriveChatBody([stvEmoteEvent()]).variant).toBe('stv_emote_event');
  });

  test('detects the viewer_milestone variant from a milestone part', () => {
    expect(deriveChatBody([viewerMilestone()]).variant).toBe(
      'viewer_milestone',
    );
  });

  test('has no dedicated variant for a raid part and falls back to user_chat', () => {
    expect(deriveChatBody([raid()]).variant).toBe('user_chat');
  });

  test('defaults to user_chat', () => {
    expect(deriveChatBody([text('gg'), emote('Kappa')]).variant).toBe(
      'user_chat',
    );
  });

  test('reuses the cached scan across calls for the same parts array', () => {
    const message = [mention('@forsen')];

    expect(deriveChatBody(message).mentionLogins).toBe(
      deriveChatBody(message).mentionLogins,
    );
  });

  test('recomputes variant when flags differ for the same parts array', () => {
    const message = [text('hi')];

    expect(deriveChatBody(message, { isAnnouncement: true }).variant).toBe(
      'announcement',
    );
    expect(deriveChatBody(message, { isAnnouncement: false }).variant).toBe(
      'user_chat',
    );
  });
});
