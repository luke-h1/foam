import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { useAuthContext } from '@app/context/AuthContext';
import { useDebugOptions } from '@app/hooks/use-debug-options';
import { NAMESPACE, storageService } from '@app/lib/storage';
import { twitchService } from '@app/services/twitch-service';

function handleClearDebugStorage() {
  Alert.alert('Clear storage?', `This will wipe ${NAMESPACE}`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Clear',
      style: 'destructive',
      onPress: () => storageService.clear(),
    },
  ]);
}

function handleToggleReactQueryDebug(val: boolean) {
  storageService.set('ReactQueryDebug', val);
}

export function useDebugScreenState() {
  const debugOptions = useDebugOptions();
  const { user, authState } = useAuthContext();

  const [username, setUsername] = useState('');
  const [channelName, setChannelName] = useState('');
  const channelIdRef = useRef('');
  const reactQueryEnabled = debugOptions.ReactQueryDebug?.enabled ?? false;
  const accessToken = authState?.token?.accessToken ?? '';
  const tokenKind = authState?.isAnonAuth ? 'anon' : 'user';

  useEffect(() => {
    const query = channelName.trim();
    channelIdRef.current = '';

    if (!query) {
      return;
    }

    let active = true;

    const timeout = setTimeout(() => {
      void twitchService
        .getUser(query)
        .then(r => {
          if (active) {
            channelIdRef.current = r.id;
          }
        })
        .catch(() => {
          if (active) {
            channelIdRef.current = '';
          }
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [channelName]);

  const handleConvertUsername = useCallback(async () => {
    if (!username.trim()) {
      return;
    }

    try {
      const res = await twitchService.getUser(username);
      await Clipboard.setStringAsync(res.id);
      Alert.alert('Copied', res.id);
    } catch {
      Alert.alert('Not found');
    }
  }, [username]);

  const handleCopyToken = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    await Clipboard.setStringAsync(accessToken);
    toast.success('Copied');
  }, [accessToken]);

  const handleCopyStorageState = useCallback(async () => {
    await Clipboard.setStringAsync(JSON.stringify(debugOptions, null, 2));
    toast.success('Storage state copied');
  }, [debugOptions]);

  const handleJoinChannel = useCallback(() => {
    if (!channelName.trim()) {
      return;
    }

    router.push({
      pathname: '/chat',
      params: { channelName, channelId: channelIdRef.current },
    });
  }, [channelName]);

  return {
    user,
    username,
    setUsername,
    channelName,
    setChannelName,
    reactQueryEnabled,
    accessToken,
    tokenKind,
    handleClearDebugStorage,
    handleToggleReactQueryDebug,
    handleConvertUsername,
    handleCopyToken,
    handleCopyStorageState,
    handleJoinChannel,
  };
}
