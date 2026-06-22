export function getSubscriptionTierDisplay(subscriptionEvent: {
  plan?: string;
  planName?: string;
}): string {
  if ('plan' in subscriptionEvent && subscriptionEvent.plan) {
    switch (subscriptionEvent.plan) {
      case '1000':
      case 'Prime':
        return 'Prime';
      case '2000':
        return 'Tier 1';
      case '3000':
        return 'Tier 2';
      case '3001':
        return 'Tier 3';
      default:
        return 'Tier 1';
    }
  }
  if ('planName' in subscriptionEvent && subscriptionEvent.planName) {
    return subscriptionEvent.planName;
  }
  return 'Tier 1';
}
