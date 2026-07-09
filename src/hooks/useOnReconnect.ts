import { useEffect } from 'react';

import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

/**
 * Registers react-query's online status listener with expo-network so queries
 * auto-refetch when connectivity returns.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/react-native#online-status-management
 */
export function useOnReconnect() {
  useEffect(() => {
    return onlineManager.setEventListener(setOnline => {
      const eventSubscription = Network.addNetworkStateListener(state => {
        setOnline(!!state.isConnected);
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      return eventSubscription.remove;
    });
  }, []);
}
