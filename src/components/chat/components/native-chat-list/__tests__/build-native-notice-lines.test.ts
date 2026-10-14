import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chat-message.fixture';
import {
  ritual,
  subscription,
} from '@app/utils/chat/derive-chat-body/__tests__/__fixtures__/derive-chat-body.fixture';
import type {
  NativeChatLineIcon,
  NativeChatRow,
} from '@modules/native-chat-list/src/NativeChatList.types';

import { buildNativeChatRow } from '../util/build-native-chat-row';
import {
  createNativeRowContext,
  createNativeRowLiveState,
} from './__fixtures__/build-native-chat-row.fixture';

interface LineSummary {
  icon?: NativeChatLineIcon;
  texts: string[];
}

function summariseRow(row: NativeChatRow) {
  return {
    accessibilityLabel: row.accessibilityLabel,
    borderLeftColor: row.surface.borderLeftColor,
    lines: row.lines.map((line): LineSummary =>
      line.icon
        ? { icon: line.icon, texts: line.spans.map(span => span.text) }
        : { texts: line.spans.map(span => span.text) },
    ),
  };
}

describe('buildNativeNoticeLines', () => {
  test('draws a ritual as a meta line and its description', () => {
    const row = buildNativeChatRow(
      createChatMessageFixture({ message: [ritual()], sender: 'forsen' }),
      createNativeRowContext({ showTimestamps: true }),
      createNativeRowLiveState(),
    );

    expect(summariseRow(row)).toEqual({
      accessibilityLabel: 'New chatter. forsen is new here',
      borderLeftColor: '#a78bfa',
      lines: [
        { texts: ['12:00'] },
        {
          icon: {
            color: '#a78bfa',
            marginRight: 4,
            name: 'hand.wave.fill',
            size: 12,
          },
          texts: ['New chatter'],
        },
        { texts: ['forsen is new here'] },
      ],
    });
  });

  test('draws a subscription without a timestamp', () => {
    const row = buildNativeChatRow(
      createChatMessageFixture({ message: [subscription()], sender: 'forsen' }),
      createNativeRowContext({ showTimestamps: true }),
      createNativeRowLiveState(),
    );

    expect(summariseRow(row)).toEqual({
      accessibilityLabel: 'forsen Subscribed with Prime.',
      borderLeftColor: '#FFD700',
      lines: [
        {
          icon: {
            color: '#FFD700',
            marginRight: 4,
            name: 'star.fill',
            size: 12,
          },
          texts: ['forsen', 'Subscribed with Prime.'],
        },
      ],
    });
  });
});
