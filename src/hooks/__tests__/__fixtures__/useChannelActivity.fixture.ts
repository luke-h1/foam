import type { EventSubMessage } from '@app/types/twitch/eventsub';
import type { ChannelActivity } from '@app/utils/twitch/channelActivity/channelActivity';

export interface TestActivityHelixItem {
  id: string;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface TestActivityState {
  id: string;
  status: string;
  source: 'helix' | 'event';
}

export function createTestActivity(
  overrides: Partial<
    ChannelActivity<TestActivityHelixItem, TestActivityState>
  > = {},
): ChannelActivity<TestActivityHelixItem, TestActivityState> {
  return {
    fetch: () => Promise.resolve({ data: [] }),
    normaliseHelix: item => ({
      id: item.id,
      status: item.status.toLowerCase(),
      source: 'helix',
    }),
    isActive: value => value.status === 'active',
    fetchFailure: {
      message: 'Failed to fetch test activity state',
      name: 'test_activity_warning',
      action: 'initial_test_activity_fetch_failed',
    },
    events: [
      {
        type: 'channel.test.begin',
        normalise: event => ({
          id: String((event as { id: string }).id),
          status: 'active',
          source: 'event',
        }),
      },
      {
        type: 'channel.test.end',
        normalise: event => ({
          id: String((event as { id: string }).id),
          status: 'completed',
          source: 'event',
        }),
      },
    ],
    ...overrides,
  };
}

export function createEventSubMessage(
  event?: Record<string, unknown>,
): EventSubMessage {
  return {
    metadata: {
      message_id: 'message-1',
      message_type: 'notification',
      message_timestamp: '2026-05-09T10:00:00Z',
    },
    payload: {},
    event,
  };
}
