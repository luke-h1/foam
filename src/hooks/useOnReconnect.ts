import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

/**
 * Wires react-query's online status to expo-network so queries auto-refetch when connectivity returns. Runs once at module load - `onlineManager.setEventListener` stores its cleanup internally (same pattern as focusManager in query-provider).
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
