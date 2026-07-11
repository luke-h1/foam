import { deriveChatBody } from '../deriveChatBody';
import {
  charityDonation,
  emote,
  mention,
  raid,
  ritual,
  stvEmoteEvent,
  subscription,
  text,
  viewerMilestone,
} from './__fixtures__/deriveChatBody.fixture';

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
