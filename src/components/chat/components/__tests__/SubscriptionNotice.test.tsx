import { screen } from '@testing-library/react-native';

import render from '@app/test/render';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { SubscriptionNoticeTokenType } from '@app/utils/chat/subscription-notice-token-types';

import { parseMessageText } from '../chat-message/util/parseMessageText';
import { SubscriptionNotice } from '../user-notices/SubscriptionNotice';

function renderNotice(token: MessageToken<SubscriptionNoticeTokenType>) {
  return render(
    <SubscriptionNotice
      messageTokens={parseMessageText(token.subscriptionEvent.message)}
      token={token}
    />,
  );
}

describe('SubscriptionNotice', () => {
  describe('sub (new subscription)', () => {
    test('displays subscription message for new subscription', () => {
      const token: MessageToken<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'TestUser',
          plan: '1000',
          planName: 'Tier 1',
        },
      };

      renderNotice(token);

      expect(screen.getByText('TestUser')).toBeOnTheScreen();

      expect(screen.getByText(/Subscribed/)).toBeOnTheScreen();
    });

    test('displays subscriber message when provided', () => {
      const token: MessageToken<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'MessageUser',
          plan: '1000',
          planName: 'Tier 1',
          message: 'Thanks for the great content!',
        },
      };

      renderNotice(token);

      expect(
        screen.getByText('Thanks for the great content!'),
      ).toBeOnTheScreen();
    });
  });

  describe('resub (resubscription)', () => {
    test('displays resubscription message with months', () => {
      const token: MessageToken<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'ResubUser',
          plan: '1000',
          planName: 'Tier 1',
          months: 6,
        },
      };

      renderNotice(token);

      expect(screen.getByText('ResubUser')).toBeOnTheScreen();

      expect(screen.getByText(/Subscribed/)).toBeOnTheScreen();

      expect(screen.getByText(/6 months/)).toBeOnTheScreen();
    });

    test('displays singular month for resubscription', () => {
      const token: MessageToken<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'ResubUser',
          plan: '1000',
          planName: 'Tier 1',
          months: 1,
        },
      };

      renderNotice(token);

      expect(screen.getByText('1 month')).toBeOnTheScreen();
    });

    test('displays Prime resubscription correctly', () => {
      const token: MessageToken<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'PrimeResubUser',
          plan: 'Prime',
          planName: 'Prime',
          months: 12,
        },
      };

      renderNotice(token);

      expect(screen.getByText(/Subscribed with Prime/)).toBeOnTheScreen();

      expect(screen.getByText(/12 months/)).toBeOnTheScreen();
    });

    test('displays streak information for resubscription', () => {
      const token: MessageToken<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'StreakResubUser',
          plan: '1000',
          planName: 'Tier 1',
          months: 6,
          streakMonths: 6,
          shouldShareStreak: true,
        },
      };

      renderNotice(token);

      expect(screen.getByText(/, 6 months in a row/)).toBeOnTheScreen();
    });

    test('displays plan name for non-Prime resubscription', () => {
      const token: MessageToken<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'Tier3ResubUser',
          plan: '3000',
          planName: 'Tier 3',
          months: 3,
        },
      };

      renderNotice(token);

      expect(screen.getByText(/with Tier 3/)).toBeOnTheScreen();
    });
  });

  describe('subgift (gift subscription)', () => {
    test('displays gift subscription with recipient', () => {
      const token: MessageToken<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'GifterUser',
          plan: '1000',
          planName: 'Tier 1',
          recipientDisplayName: 'RecipientUser',
          recipientId: '123',
          giftMonths: 1,
          months: 1,
        },
      };

      renderNotice(token);

      expect(screen.getByText('GifterUser')).toBeOnTheScreen();

      expect(
        screen.getByText(/Gifted a Tier 1 subscription to/),
      ).toBeOnTheScreen();

      expect(screen.getByText('RecipientUser')).toBeOnTheScreen();
    });

    test('displays gift subscription without recipient', () => {
      const token: MessageToken<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'GifterUser',
          plan: '1000',
          planName: 'Tier 1',
          recipientDisplayName: '',
          recipientId: '123',
          giftMonths: 1,
          months: 1,
        },
      };

      renderNotice(token);

      expect(
        screen.getByText(/Gifted a Tier 1 subscription/),
      ).toBeOnTheScreen();
    });

    test('displays gift months for gift subscription with multiple months', () => {
      const token: MessageToken<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'GifterUser',
          plan: '1000',
          planName: 'Tier 1',
          recipientDisplayName: 'RecipientUser',
          recipientId: '123',
          giftMonths: 3,
          months: 3,
        },
      };

      renderNotice(token);

      expect(screen.getByText(/\(3 months\)/)).toBeOnTheScreen();
    });

    test('does not display gift months for single month gift', () => {
      const token: MessageToken<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'GifterUser',
          plan: '1000',
          planName: 'Tier 1',
          recipientDisplayName: 'RecipientUser',
          recipientId: '123',
          giftMonths: 1,
          months: 1,
        },
      };

      renderNotice(token);

      // Single month gifts don't show the month count in parentheses
      expect(screen.queryByText(/\(1 month\)/)).not.toBeOnTheScreen();
    });

    test('displays Prime gift subscription correctly', () => {
      const token: MessageToken<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'PrimeGifterUser',
          plan: 'Prime',
          planName: 'Prime',
          recipientDisplayName: 'RecipientUser',
          recipientId: '123',
          giftMonths: 1,
          months: 1,
        },
      };

      renderNotice(token);

      expect(screen.getByText(/Gifted a Prime subscription/)).toBeOnTheScreen();
    });

    test('does not display gift months when giftMonths is 0', () => {
      const token: MessageToken<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'GifterUser',
          plan: '1000',
          planName: 'Tier 1',
          recipientDisplayName: 'RecipientUser',
          recipientId: '123',
          giftMonths: 0,
          months: 0,
        },
      };

      renderNotice(token);

      expect(screen.queryByText(/\(\d+ month/)).not.toBeOnTheScreen();
    });
  });

  describe('anongiftpaidupgrade', () => {
    test('displays anonymous gift paid upgrade', () => {
      const token: MessageToken<'anongiftpaidupgrade'> = {
        type: 'anongiftpaidupgrade',
        subscriptionEvent: {
          msgId: 'anongiftpaidupgrade',
          displayName: 'AnonymousGifter',
          promoName: 'Valorant',
          promoGiftTotal: '5',
        },
      };

      renderNotice(token);

      expect(screen.getByText('AnonymousGifter')).toBeOnTheScreen();

      expect(
        screen.getByText(/Continuing their gift subscription/),
      ).toBeOnTheScreen();

      expect(screen.getByText(/\(Valorant, 5 total\)/)).toBeOnTheScreen();
    });

    test('displays anonymous gift paid upgrade without total', () => {
      const token: MessageToken<'anongiftpaidupgrade'> = {
        type: 'anongiftpaidupgrade',
        subscriptionEvent: {
          msgId: 'anongiftpaidupgrade',
          displayName: 'AnonymousGifter',
          promoName: 'SummerPromo',
          promoGiftTotal: '',
        },
      };

      renderNotice(token);

      expect(screen.getByText(/\(SummerPromo\)/)).toBeOnTheScreen();
    });

    test('displays anonymous gift paid upgrade without promo name', () => {
      const token: MessageToken<'anongiftpaidupgrade'> = {
        type: 'anongiftpaidupgrade',
        subscriptionEvent: {
          msgId: 'anongiftpaidupgrade',
          displayName: 'AnonymousGifter',
          promoName: '',
          promoGiftTotal: '',
        },
      };

      renderNotice(token);

      expect(
        screen.getByText(/Continuing their gift subscription/),
      ).toBeOnTheScreen();
    });
  });

  describe('submysterygift', () => {
    test('displays community gift count and channel total', () => {
      const token: MessageToken<'submysterygift'> = {
        type: 'submysterygift',
        subscriptionEvent: {
          msgId: 'submysterygift',
          displayName: 'MysteryGifter',
          plan: '1000',
          planName: 'Tier 1',
          massGiftCount: 5,
          senderCount: 42,
        },
      };

      renderNotice(token);

      expect(screen.getByText('MysteryGifter')).toBeOnTheScreen();

      expect(screen.getByText(/Gifted/)).toBeOnTheScreen();

      expect(screen.getByText('5')).toBeOnTheScreen();

      expect(
        screen.getByText(/Tier 1 subscriptions to the community/),
      ).toBeOnTheScreen();

      expect(
        screen.getByText(/They've gifted 42 in the channel/),
      ).toBeOnTheScreen();
    });

    test('handles a single community gift cleanly', () => {
      const token: MessageToken<'submysterygift'> = {
        type: 'submysterygift',
        subscriptionEvent: {
          msgId: 'submysterygift',
          displayName: 'SoloGifter',
          plan: 'Prime',
          planName: 'Prime',
          massGiftCount: 1,
        },
      };

      renderNotice(token);

      expect(screen.getByText(/Gifted/)).toBeOnTheScreen();

      expect(screen.getByText('1')).toBeOnTheScreen();

      expect(
        screen.getByText(/Prime subscription to the community/),
      ).toBeOnTheScreen();
    });
  });

  describe('giftpaidupgrade', () => {
    test('displays the original gifter when available', () => {
      const token: MessageToken<'giftpaidupgrade'> = {
        type: 'giftpaidupgrade',
        subscriptionEvent: {
          msgId: 'giftpaidupgrade',
          displayName: 'UpgradeUser',
          senderLogin: 'gifterlogin',
          senderName: 'GiftSender',
          promoName: 'Subtember',
          promoGiftTotal: '12',
        },
      };

      renderNotice(token);

      expect(screen.getByText('UpgradeUser')).toBeOnTheScreen();

      expect(screen.getByText(/Continuing the gift sub/)).toBeOnTheScreen();

      expect(screen.getByText('GiftSender')).toBeOnTheScreen();

      expect(screen.getByText(/\(Subtember, 12 total\)/)).toBeOnTheScreen();
    });

    test('renders without sender or promo metadata', () => {
      const token: MessageToken<'giftpaidupgrade'> = {
        type: 'giftpaidupgrade',
        subscriptionEvent: {
          msgId: 'giftpaidupgrade',
          displayName: 'UpgradeUser',
        },
      };

      renderNotice(token);

      expect(screen.getByText(/Continuing the gift sub/)).toBeOnTheScreen();
    });
  });

  describe('edge cases', () => {
    test('reads as Tier 1 when the notice has no plan name', () => {
      const token: MessageToken<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'MinimalUser',
          plan: '1000',
        },
      };

      renderNotice(token);

      expect(screen.getByText('MinimalUser')).toBeOnTheScreen();

      expect(screen.getByText('Subscribed with Tier 1.')).toBeOnTheScreen();
    });

    test('renders a notice with an empty display name', () => {
      const token: MessageToken<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: '',
          plan: '1000',
          planName: 'Tier 1',
        },
      };

      renderNotice(token);

      expect(screen.getByText(/Subscribed/)).toBeOnTheScreen();
    });
  });
});
