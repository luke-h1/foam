import render from '@app/test/render';
import { screen } from '@testing-library/react-native';
import { View } from 'react-native';

import {
  buildSubscriptionNoticeDescription,
  type SubscriptionDescriptionInput,
} from '../buildSubscriptionNoticeDescription';
import { createSubscriptionDescriptionInput } from './__fixtures__/buildSubscriptionNoticeDescription.fixture';

function renderDescription(input: SubscriptionDescriptionInput) {
  return render(<View>{buildSubscriptionNoticeDescription(input)}</View>);
}

describe('buildSubscriptionNoticeDescription', () => {
  test('describes a new tier subscription', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'sub',
        tierDisplay: 'Tier 2',
      }),
    );

    expect(screen.getByText(/Subscribed with Tier 2\./)).toBeOnTheScreen();
  });

  test('describes a new Prime subscription', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'sub',
        isPrime: true,
        tierDisplay: 'Prime',
      }),
    );

    expect(screen.getByText(/Subscribed with Prime\./)).toBeOnTheScreen();
  });

  test('describes a resubscription without cumulative months', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'resub',
        cumulativeMonths: 0,
      }),
    );

    expect(screen.getByText(/Subscribed with Tier 1\./)).toBeOnTheScreen();
    expect(screen.queryByText(/They've subscribed for/)).not.toBeOnTheScreen();
  });

  test('describes a resubscription with cumulative months', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'resub',
        cumulativeMonths: 6,
      }),
    );

    expect(screen.getByText(/6 months/)).toBeOnTheScreen();
  });

  test('uses singular month copy for a one-month resubscription', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'resub',
        cumulativeMonths: 1,
      }),
    );

    expect(screen.getByText(/1 month/)).toBeOnTheScreen();
    expect(screen.queryByText(/1 months/)).not.toBeOnTheScreen();
  });

  test('includes streak months when sharing is enabled', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'resub',
        cumulativeMonths: 6,
        streakMonths: 6,
        shouldShareStreak: true,
      }),
    );

    expect(screen.getByText(/, 6 months in a row/)).toBeOnTheScreen();
  });

  test('omits streak months when sharing is disabled', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'resub',
        cumulativeMonths: 6,
        streakMonths: 6,
        shouldShareStreak: false,
      }),
    );

    expect(screen.queryByText(/in a row/)).not.toBeOnTheScreen();
  });

  test('describes a gift subscription with recipient and gift months', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'subgift',
        recipientDisplayName: 'RecipientUser',
        giftMonths: 3,
      }),
    );

    expect(
      screen.getByText(/Gifted a Tier 1 subscription to/),
    ).toBeOnTheScreen();
    expect(screen.getByText('RecipientUser')).toBeOnTheScreen();
    expect(screen.getByText(/\(3 months\)/)).toBeOnTheScreen();
  });

  test('describes a gift subscription without a recipient', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'subgift',
        recipientDisplayName: '',
      }),
    );

    expect(
      screen.getByText(/Gifted a Tier 1 subscription\./),
    ).toBeOnTheScreen();
  });

  test('does not show gift months for a single-month gift', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'subgift',
        recipientDisplayName: 'RecipientUser',
        giftMonths: 1,
      }),
    );

    expect(screen.queryByText(/\(1 month\)/)).not.toBeOnTheScreen();
  });

  test('describes an anonymous gift paid upgrade with promo metadata', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'anongiftpaidupgrade',
        promoName: 'Valorant',
        promoGiftTotal: 5,
      }),
    );

    expect(
      screen.getByText(
        /Continuing their gift subscription \(Valorant, 5 total\)\./,
      ),
    ).toBeOnTheScreen();
  });

  test('describes a community mystery gift with sender count', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'submysterygift',
        massGiftCount: 5,
        senderCount: 42,
      }),
    );

    expect(screen.getByText('5')).toBeOnTheScreen();
    expect(
      screen.getByText(/Tier 1 subscriptions to the community/),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/They've gifted 42 in the channel/),
    ).toBeOnTheScreen();
  });

  test('uses singular subscription copy for a single community gift', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'submysterygift',
        tierDisplay: 'Prime',
        massGiftCount: 1,
      }),
    );

    expect(
      screen.getByText(/Prime subscription to the community/),
    ).toBeOnTheScreen();
    expect(
      screen.queryByText(/subscriptions to the community/),
    ).not.toBeOnTheScreen();
  });

  test('describes a continuing gift upgrade with sender and promo metadata', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'giftpaidupgrade',
        senderName: 'GiftSender',
        promoName: 'Subtember',
        promoGiftTotal: 12,
      }),
    );

    expect(screen.getByText(/Continuing the gift sub/)).toBeOnTheScreen();
    expect(screen.getByText('GiftSender')).toBeOnTheScreen();
    expect(screen.getByText(/\(Subtember, 12 total\)/)).toBeOnTheScreen();
  });

  test('describes a Prime upgrade to a paid tier', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'primepaidupgrade',
        isPrime: false,
        tierDisplay: 'Tier 1',
      }),
    );

    expect(
      screen.getByText(/Upgraded their Prime subscription to Tier 1\./),
    ).toBeOnTheScreen();
  });

  test('describes an extended subscription', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'extendsub',
        isPrime: true,
        tierDisplay: 'Prime',
      }),
    );

    expect(
      screen.getByText(/Extended their subscription with Prime\./),
    ).toBeOnTheScreen();
  });

  test('describes a standard pay-it-forward event', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'standardpayforward',
      }),
    );

    expect(
      screen.getByText(/Paid their subscription forward to another viewer\./),
    ).toBeOnTheScreen();
  });

  test('describes a community pay-it-forward event with a recipient', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'communitypayforward',
        recipientDisplayName: 'ForwardRecipient',
      }),
    );

    expect(
      screen.getByText(/Paid their subscription forward to/),
    ).toBeOnTheScreen();
    expect(screen.getByText('ForwardRecipient')).toBeOnTheScreen();
  });

  test('describes a community pay-it-forward event without a recipient', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'communitypayforward',
      }),
    );

    expect(
      screen.getByText(/Paid their subscription forward to the community\./),
    ).toBeOnTheScreen();
  });

  test('describes a Prime community gift received event', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'primecommunitygiftreceived',
      }),
    );

    expect(
      screen.getByText(/Received a Prime subscription from the community\./),
    ).toBeOnTheScreen();
  });

  test('describes an anonymous gift subscription with a recipient', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'anonsubgift',
        recipientDisplayName: 'AnonRecipient',
      }),
    );

    expect(
      screen.getByText(/An anonymous gifter Gifted a Tier 1 subscription to/),
    ).toBeOnTheScreen();
    expect(screen.getByText('AnonRecipient')).toBeOnTheScreen();
  });

  test('describes an anonymous community mystery gift', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'anonsubmysterygift',
        massGiftCount: 10,
      }),
    );

    expect(screen.getByText(/An anonymous gifter Gifted/)).toBeOnTheScreen();
    expect(screen.getByText('10')).toBeOnTheScreen();
  });

  test('falls back for unknown subscription event ids', () => {
    renderDescription(
      createSubscriptionDescriptionInput({
        msgId: 'unknown-event',
      }),
    );

    expect(screen.getByText(/Subscription event\./)).toBeOnTheScreen();
  });
});
