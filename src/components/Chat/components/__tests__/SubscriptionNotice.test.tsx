import render from '@app/test/render';
import { ParsedPart } from '@app/utils';
import { screen } from '@testing-library/react-native';
import { SubscriptionNotice } from '../usernotices/SubscriptionNotice';

describe('SubscriptionNotice', () => {
  describe('sub (new subscription)', () => {
    test('renders NEW badge for new subscription', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'TestUser',
          plan: '2000',
          planName: 'Tier 1',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText('NEW')).toBeOnTheScreen();
      expect(screen.queryByText('RESUB')).not.toBeOnTheScreen();
    });

    test('displays subscription message for new subscription', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'TestUser',
          plan: '2000',
          planName: 'Tier 1',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText('TestUser')).toBeOnTheScreen();
      expect(screen.getByText(/subscribed/)).toBeOnTheScreen();
    });

    test('displays Prime subscription correctly', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'PrimeUser',
          plan: '1000',
          planName: 'Prime',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText('PrimeUser')).toBeOnTheScreen();
      expect(screen.getByText(/subscribed with Prime/)).toBeOnTheScreen();
    });

    test('displays plan name for non-Prime subscriptions', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'Tier2User',
          plan: '3000',
          planName: 'Tier 2',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/\(Tier 2\)/)).toBeOnTheScreen();
    });

    test('displays streak information when shouldShareStreak is true', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'StreakUser',
          plan: '2000',
          planName: 'Tier 1',
          streakMonths: 3,
          shouldShareStreak: true,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/, 3 months in a row/)).toBeOnTheScreen();
    });

    test('displays singular month for streak', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'StreakUser',
          plan: '2000',
          planName: 'Tier 1',
          streakMonths: 1,
          shouldShareStreak: true,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/, 1 month in a row/)).toBeOnTheScreen();
    });

    test('does not display streak when shouldShareStreak is false', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'NoStreakUser',
          plan: '2000',
          planName: 'Tier 1',
          streakMonths: 5,
          shouldShareStreak: false,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.queryByText(/months in a row/)).not.toBeOnTheScreen();
    });

    test('displays subscriber message when provided', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'MessageUser',
          plan: '2000',
          planName: 'Tier 1',
          message: 'Thanks for the great content!',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(
        screen.getByText('Thanks for the great content!'),
      ).toBeOnTheScreen();
    });

    test('does not display empty message', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'NoMessageUser',
          plan: '2000',
          planName: 'Tier 1',
          message: '',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.queryByTestId('messageContainer')).not.toBeOnTheScreen();
    });

    test('does not display whitespace-only message', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'WhitespaceUser',
          plan: '2000',
          planName: 'Tier 1',
          message: '   ',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.queryByTestId('messageContainer')).not.toBeOnTheScreen();
    });
  });

  describe('resub (resubscription)', () => {
    test('renders RESUB badge for resubscription', () => {
      const part: ParsedPart<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'ResubUser',
          plan: '2000',
          planName: 'Tier 1',
          months: 6,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText('RESUB')).toBeOnTheScreen();
      expect(screen.queryByText('NEW')).not.toBeOnTheScreen();
    });

    test('displays resubscription message with months', () => {
      const part: ParsedPart<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'ResubUser',
          plan: '2000',
          planName: 'Tier 1',
          months: 6,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText('ResubUser')).toBeOnTheScreen();
      expect(screen.getByText(/resubscribed for 6 months/)).toBeOnTheScreen();
    });

    test('displays singular month for resubscription', () => {
      const part: ParsedPart<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'ResubUser',
          plan: '2000',
          planName: 'Tier 1',
          months: 1,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/resubscribed for 1 month/)).toBeOnTheScreen();
    });

    test('displays resubscription without months when months is 0', () => {
      const part: ParsedPart<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'ResubUser',
          plan: '2000',
          planName: 'Tier 1',
          months: 0,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/resubscribed$/)).toBeOnTheScreen();
      expect(screen.queryByText(/for \d+ month/)).not.toBeOnTheScreen();
    });

    test('displays Prime resubscription correctly', () => {
      const part: ParsedPart<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'PrimeResubUser',
          plan: '1000',
          planName: 'Prime',
          months: 12,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(
        screen.getByText(/resubscribed for 12 months with Prime/),
      ).toBeOnTheScreen();
    });

    test('displays streak information for resubscription', () => {
      const part: ParsedPart<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'StreakResubUser',
          plan: '2000',
          planName: 'Tier 1',
          months: 6,
          streakMonths: 6,
          shouldShareStreak: true,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/, 6 months in a row/)).toBeOnTheScreen();
    });

    test('displays plan name for non-Prime resubscription', () => {
      const part: ParsedPart<'resub'> = {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'Tier3ResubUser',
          plan: '3001',
          planName: 'Tier 3',
          months: 3,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/\(Tier 3\)/)).toBeOnTheScreen();
    });
  });

  describe('subgift (gift subscription)', () => {
    test('displays gift subscription with recipient', () => {
      const part: ParsedPart<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'GifterUser',
          plan: '2000',
          planName: 'Tier 1',
          recipientDisplayName: 'RecipientUser',
          recipientId: '123',
          giftMonths: 1,
          months: 1,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText('GifterUser')).toBeOnTheScreen();
      expect(
        screen.getByText(/gifted a subscription to RecipientUser/),
      ).toBeOnTheScreen();
    });

    test('displays gift subscription without recipient', () => {
      const part: ParsedPart<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'GifterUser',
          plan: '2000',
          planName: 'Tier 1',
          recipientDisplayName: '',
          recipientId: '123',
          giftMonths: 1,
          months: 1,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/gifted a subscription/)).toBeOnTheScreen();
      expect(screen.queryByText(/to/)).not.toBeOnTheScreen();
      // Should still show gift months and plan
      expect(screen.getByText(/\(1 month\)/)).toBeOnTheScreen();
    });

    test('displays gift months for gift subscription', () => {
      const part: ParsedPart<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'GifterUser',
          plan: '2000',
          planName: 'Tier 1',
          recipientDisplayName: 'RecipientUser',
          recipientId: '123',
          giftMonths: 3,
          months: 3,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/\(3 months\)/)).toBeOnTheScreen();
    });

    test('displays singular month for gift subscription', () => {
      const part: ParsedPart<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'GifterUser',
          plan: '2000',
          planName: 'Tier 1',
          recipientDisplayName: 'RecipientUser',
          recipientId: '123',
          giftMonths: 1,
          months: 1,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/\(1 month\)/)).toBeOnTheScreen();
    });

    test('displays Prime gift subscription correctly', () => {
      const part: ParsedPart<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'PrimeGifterUser',
          plan: '1000',
          planName: 'Prime',
          recipientDisplayName: 'RecipientUser',
          recipientId: '123',
          giftMonths: 1,
          months: 1,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/with Prime/)).toBeOnTheScreen();
    });

    test('does not display gift months when giftMonths is 0', () => {
      const part: ParsedPart<'anongift'> = {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'GifterUser',
          plan: '2000',
          planName: 'Tier 1',
          recipientDisplayName: 'RecipientUser',
          recipientId: '123',
          giftMonths: 0,
          months: 0,
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.queryByText(/\(\d+ month/)).not.toBeOnTheScreen();
    });
  });

  describe('anongiftpaidupgrade', () => {
    test('displays anonymous gift paid upgrade', () => {
      const part: ParsedPart<'anongiftpaidupgrade'> = {
        type: 'anongiftpaidupgrade',
        subscriptionEvent: {
          msgId: 'anongiftpaidupgrade',
          displayName: 'AnonymousGifter',
          promoName: 'Valorant',
          promoGiftTotal: '5',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText('AnonymousGifter')).toBeOnTheScreen();
      expect(
        screen.getByText(/gifted a subscription \(Valorant, 5 total\)/),
      ).toBeOnTheScreen();
    });

    test('displays anonymous gift paid upgrade without total', () => {
      const part: ParsedPart<'anongiftpaidupgrade'> = {
        type: 'anongiftpaidupgrade',
        subscriptionEvent: {
          msgId: 'anongiftpaidupgrade',
          displayName: 'AnonymousGifter',
          promoName: 'SummerPromo',
          promoGiftTotal: '',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(
        screen.getByText(/gifted a subscription \(SummerPromo\)/),
      ).toBeOnTheScreen();
    });

    test('displays anonymous gift paid upgrade without promo name', () => {
      const part: ParsedPart<'anongiftpaidupgrade'> = {
        type: 'anongiftpaidupgrade',
        subscriptionEvent: {
          msgId: 'anongiftpaidupgrade',
          displayName: 'AnonymousGifter',
          promoName: '',
          promoGiftTotal: '',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/gifted a subscription$/)).toBeOnTheScreen();
      expect(screen.queryByText(/\(/)).not.toBeOnTheScreen();
    });
  });

  describe('plan display', () => {
    test('uses planName when available', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'TestUser',
          plan: '2000',
          planName: 'Custom Plan Name',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/\(Custom Plan Name\)/)).toBeOnTheScreen();
    });

    test('maps plan code 1000 to Prime', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'TestUser',
          plan: '1000',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/subscribed with Prime/)).toBeOnTheScreen();
    });

    test('maps plan code 2000 to Tier 1', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'TestUser',
          plan: '2000',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/\(Tier 1\)/)).toBeOnTheScreen();
    });

    test('maps plan code 3000 to Tier 2', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'TestUser',
          plan: '3000',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/\(Tier 2\)/)).toBeOnTheScreen();
    });

    test('maps plan code 3001 to Tier 3', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'TestUser',
          plan: '3001',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/\(Tier 3\)/)).toBeOnTheScreen();
    });

    test('handles unknown plan code', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'TestUser',
          plan: '9999',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText('TestUser')).toBeOnTheScreen();
      expect(screen.getByText(/subscribed/)).toBeOnTheScreen();
      expect(screen.queryByText(/\(/)).not.toBeOnTheScreen();
    });
  });

  describe('edge cases', () => {
    test('handles missing optional fields gracefully', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'MinimalUser',
          plan: '2000',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText('MinimalUser')).toBeOnTheScreen();
      expect(screen.getByText(/subscribed/)).toBeOnTheScreen();
    });

    test('handles empty display name', () => {
      const part: ParsedPart<'sub'> = {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: '',
          plan: '2000',
          planName: 'Tier 1',
        },
      };

      render(<SubscriptionNotice part={part} />);

      expect(screen.getByText(/subscribed/)).toBeOnTheScreen();
    });
  });
});
