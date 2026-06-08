/* eslint-disable react-doctor/no-multi-comp */
import { Text } from '@app/components/ui/Text/Text';
import type { ReactNode } from 'react';
import { subscriptionNoticeStyles } from '../subscriptionNoticeStyles';

export function SubscriptionDescriptionText({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Text style={subscriptionNoticeStyles.descriptionText}>{children}</Text>
  );
}

export function SubscriptionDescriptionHighlight({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Text style={subscriptionNoticeStyles.monthsHighlight}>{children}</Text>
  );
}

export function SubscriptionDescriptionRecipient({
  children,
}: {
  children: ReactNode;
}) {
  return <Text style={subscriptionNoticeStyles.recipientName}>{children}</Text>;
}
