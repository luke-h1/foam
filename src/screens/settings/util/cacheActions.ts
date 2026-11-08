import { Alert } from 'react-native';

import { toast } from 'sonner-native';

import { queryClient } from '@app/lib/react-query/queryClient';
import { storageService } from '@app/lib/storage';
import { resetChannelSession } from '@app/store/chat/actions/channel-session';
import { clearImageCache } from '@app/utils/image/clearImageCache';

export function confirmClearSavedData() {
  Alert.alert(
    'Clear saved data?',
    'Removes Foam data on this device and loads everything fresh. You stay signed in.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          storageService.clear();
          queryClient.clear();
          toast.success('Saved data cleared');
        },
      },
    ],
  );
}

export function confirmClearCache() {
  Alert.alert(
    'Clear cache?',
    'Cached emotes, badges, 7TV cosmetics and images download again when needed.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          resetChannelSession('clear-cache');

          void clearImageCache().then(() => {
            toast.success('Cache cleared');
          });
        },
      },
    ],
  );
}
