import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

export function useOnReconnect() {
  /**
   * support auto refetch on network reconnect for react-query
   * @see https://tanstack.com/query/latest/docs/framework/react/react-native#online-status-management
   */
  onlineManager.setEventListener(setOnline => {
    const eventSubscription = Network.addNetworkStateListener(state => {
      setOnline(!!state.isConnected);
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    return eventSubscription.remove;
  });
}
