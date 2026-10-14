import type { ReactNode } from 'react';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { subscriptionSegmentStyles } from '@app/components/chat/components/user-notices/subscription-notice.styles';

import {
  getSubscriptionNoticeSegments,
  type SubscriptionDescriptionInput,
} from './util/subscription-notice-segments';

export function buildSubscriptionNoticeDescription(
  input: SubscriptionDescriptionInput,
): ReactNode[] {
  return getSubscriptionNoticeSegments(input).map(segment => (
    <ChatText key={segment.key} style={subscriptionSegmentStyles[segment.tone]}>
      {segment.text}
    </ChatText>
  ));
}
