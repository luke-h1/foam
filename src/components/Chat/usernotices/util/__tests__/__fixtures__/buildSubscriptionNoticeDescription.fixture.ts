import type { SubscriptionDescriptionInput } from '../../buildSubscriptionNoticeDescription';

const baseSubscriptionDescriptionInput: SubscriptionDescriptionInput = {
  msgId: 'sub',
  isPrime: false,
  tierDisplay: 'Tier 1',
};

export function createSubscriptionDescriptionInput(
  overrides: Partial<SubscriptionDescriptionInput> = {},
): SubscriptionDescriptionInput {
  return {
    ...baseSubscriptionDescriptionInput,
    ...overrides,
  };
}
