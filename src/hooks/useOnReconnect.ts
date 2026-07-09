import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

/**
 * Registers react-query's online status listener with expo-network so queries
 * auto-refetch when connectivity returns.
 *
 * `onlineManager.setEventListener` returns void and stores the setup cleanup
 * internally, so this runs once at module load (same pattern as
 * `focusManager.setEventListener` in query-provider).
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/react-native#online-status-management
 */
onlineManager.setEventListener(setOnline => {
  const eventSubscription = Network.addNetworkStateListener(state => {
    setOnline(!!state.isConnected);
  });
  // eslint-disable-next-line @typescript-eslint/unbound-method
  return eventSubscription.remove;
});
