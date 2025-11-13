import { formatSubscriptionNotice } from './formatSubscriptionNotice';

export type MockSubscriptionType =
  | 'sub'
  | 'resub'
  | 'subgift'
  | 'submysterygift'
  | 'raid';

interface CreateMockSubscriptionNoticeParams {
  channel: string;
  type: MockSubscriptionType;
  displayName?: string;
  message?: string;
  months?: number;
  plan?: '1000' | '2000' | '3000' | '3001'; // Prime, Tier 1, Tier 2, Tier 3
  recipientDisplayName?: string; // for subgift
  giftMonths?: number; // for submysterygift
  viewerCount?: number; // for raid
}

/**
 * Creates a mock subscription notice for testing
 */
export function createMockSubscriptionNotice({
  channel,
  type,
  displayName = 'TestUser',
  message,
  months,
  plan = '2000', // Default to Tier 1
  recipientDisplayName,
  giftMonths,
  viewerCount,
}: CreateMockSubscriptionNoticeParams) {
  const tags: Record<string, string> = {
    'msg-id': type,
    'display-name': displayName,
    login: displayName.toLowerCase(),
    id: `test_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    color: '#9146FF', // Twitch purple
  };

  // Add type-specific tags
  switch (type) {
    case 'resub':
      if (months !== undefined) {
        tags['msg-param-months'] = months.toString();
      }
      tags['msg-param-sub-plan'] = plan;
      break;

    case 'sub':
      tags['msg-param-sub-plan'] = plan;
      break;

    case 'subgift':
      tags['msg-param-sub-plan'] = plan;
      if (recipientDisplayName) {
        tags['msg-param-recipient-display-name'] = recipientDisplayName;
        tags['msg-param-recipient-id'] =
          `recipient_${recipientDisplayName.toLowerCase()}`;
      }
      break;

    case 'submysterygift':
      tags['msg-param-sub-plan'] = plan;
      if (giftMonths !== undefined) {
        tags['msg-param-gift-months'] = giftMonths.toString();
      }
      break;

    case 'raid':
      if (viewerCount !== undefined) {
        tags['msg-param-viewer-count'] = viewerCount.toString();
      }
      break;

    default:
      // Handle any unexpected types
      break;
  }

  return formatSubscriptionNotice({
    channel,
    tags,
    message,
  });
}

/**
 * Quick helper functions for common subscription types
 */
export const mockSubscriptions = {
  /**
   * New subscription
   */
  sub: (
    channel: string,
    displayName?: string,
    plan?: '1000' | '2000' | '3000' | '3001',
    message?: string,
  ) =>
    createMockSubscriptionNotice({
      channel,
      type: 'sub',
      displayName,
      plan,
      message,
    }),

  /**
   * Resubscription with months
   */
  resub: (
    channel: string,
    displayName?: string,
    months = 1,
    plan?: '1000' | '2000' | '3000' | '3001',
    message?: string,
  ) =>
    createMockSubscriptionNotice({
      channel,
      type: 'resub',
      displayName,
      months,
      plan,
      message,
    }),

  /**
   * Gifted subscription
   */
  subgift: (
    channel: string,
    displayName?: string,
    recipientDisplayName?: string,
    plan?: '1000' | '2000' | '3000' | '3001',
  ) =>
    createMockSubscriptionNotice({
      channel,
      type: 'subgift',
      displayName,
      recipientDisplayName,
      plan,
    }),

  /**
   * Mystery gift (multiple subscriptions)
   */
  submysterygift: (
    channel: string,
    displayName?: string,
    giftMonths = 5,
    plan?: '1000' | '2000' | '3000' | '3001',
  ) =>
    createMockSubscriptionNotice({
      channel,
      type: 'submysterygift',
      displayName,
      giftMonths,
      plan,
    }),

  /**
   * Raid
   */
  raid: (channel: string, displayName?: string, viewerCount = 100) =>
    createMockSubscriptionNotice({
      channel,
      type: 'raid',
      displayName,
      viewerCount,
    }),
};
