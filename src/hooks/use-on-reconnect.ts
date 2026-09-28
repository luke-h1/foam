import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

onlineManager.setEventListener(setOnline => {
  const eventSubscription = Network.addNetworkStateListener(state => {
    setOnline(!!state.isConnected);
  });
  // eslint-disable-next-line @typescript-eslint/unbound-method
  return eventSubscription.remove;
});
