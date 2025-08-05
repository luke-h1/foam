import { Text, Button, TextField, FlashList, Switch } from '@app/components';
import { useAuthContext } from '@app/context';
import { useAppNavigation, useDebugOptions } from '@app/hooks';
import {
  AllowedKey,
  NAMESPACE,
  storageService,
  twitchService,
} from '@app/services';
import {
  startLiveActivity,
  stopLiveActivity,
} from '@modules/activity-controller';
import { ListRenderItem } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { StyleSheet } from 'react-native-unistyles';

type DebugItem = {
  title: string;
  description: string;
  onPress: (value?: boolean) => void;
  type: 'button' | 'switch';
  storageKey?: AllowedKey;
};

const debugItems: DebugItem[] = [
  {
    title: 'Clear storage',
    description: `Clear all items within our namespace ${NAMESPACE}`,
    onPress: () => {
      storageService.clear();
    },
    type: 'button',
  },
  {
    title: 'Enable React Query DevTools',
    description: 'Enable the React Query DevTools for debugging queries.',
    storageKey: 'ReactQueryDebug',
    onPress: (value?: boolean) => {
      return storageService.set('ReactQueryDebug', value);
    },
    type: 'switch',
  },
  {
    title: 'Enable/stop live activity',
    description: 'Enable live activity test',
    onPress: () => {
      void startLiveActivity({
        customString: 'My test activity',
        customNumber: 123,
      });
    },
    type: 'button',
  },
  {
    title: 'Stop live activity',
    description: 'Stop live activity test',
    onPress: () => {
      void stopLiveActivity();
    },
    type: 'button',
  },
];

function TwitchUsernameConverter() {
  const [twitchUsername, setTwitchUsername] = useState<string>('');
  const [twitchUserId, setTwitchUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    if (!twitchUsername.trim()) {
      Alert.alert('Error', 'Please enter a Twitch username');
      return;
    }
    setIsLoading(true);
    try {
      const result = await twitchService.getUser(twitchUsername, undefined);
      if ('id' in result) {
        setTwitchUserId(result.id);
      }
    } catch {
      Alert.alert('Error', 'Failed to convert username');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.twitchSection}>
        <Text style={styles.sectionTitle}>
          Convert Twitch Username to User ID
        </Text>
        <TextField
          placeholder="Enter Twitch username"
          value={twitchUsername}
          onChangeText={setTwitchUsername}
        />
        <Button onPress={() => void handleConvert()} style={styles.button}>
          <Text>{isLoading ? 'Converting...' : 'Convert and Copy'}</Text>
        </Button>
        {twitchUserId ? (
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          <Button onPress={() => Clipboard.setStringAsync(twitchUserId)}>
            <Text style={styles.userId}>User ID: {twitchUserId}</Text>
          </Button>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function DisplayAccessToken() {
  const { authState } = useAuthContext();

  const handleCopyToClipboard = async () => {
    await Clipboard.setStringAsync(authState?.token?.accessToken || '');
  };

  return (
    <View style={styles.accessTokenContainer}>
      <Text style={styles.accessTokenLabel}>
        Auth Token ({authState?.isAnonAuth ? 'ANON' : 'USER'}):
      </Text>
      <View style={styles.accessTokenRow}>
        <Text style={styles.accessTokenValue} numberOfLines={1}>
          {authState?.token.accessToken || 'No token available'}
        </Text>
        {authState?.token.accessToken && (
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          <Button onPress={handleCopyToClipboard} style={styles.copyButton}>
            <Text style={styles.copyButtonText}>Copy</Text>
          </Button>
        )}
      </View>
    </View>
  );
}

function NavigateToChat() {
  const { user, authState } = useAuthContext();
  const { navigate } = useAppNavigation();
  const [channelName, setChannelName] = useState<string>('');
  const [twitchUserId, setTwitchUserId] = useState<string>('');

  const toUserId = async (username: string) => {
    const result = await twitchService.getUser(username);
    setTwitchUserId(result.id);
  };

  useEffect(() => {
    void toUserId(channelName);
  }, [channelName]);

  const handleJoinChannel = () => {
    if (!channelName.trim()) {
      Alert.alert('Enter a channel name');
      return;
    }

    navigate('DevTools', {
      screen: 'Chat',
      params: {
        channelName,
        channelId: twitchUserId,
      },
    });
  };
  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.navigateToChatContainer}>
        <Text style={styles.sectionTitle}>Join a Chat Channel</Text>
        <TextField
          placeholder="Enter channel name"
          value={channelName}
          onChangeText={e => setChannelName(e)}
          autoComplete="off"
          autoCapitalize="none"
        />
        <Button onPress={handleJoinChannel} style={styles.button}>
          <Text>Join Channel</Text>
        </Button>
        {authState?.token?.accessToken && (
          <Text style={styles.loggedInUser}>
            Logged in as:{' '}
            {authState.isAnonAuth ? 'Anonymous' : user?.display_name}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

export function DebugScreen() {
  const debugOptions = useDebugOptions();
  const [switchOptions, setSwitchOptions] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const newSwitchOptions = debugItems.reduce(
      (acc, item) => {
        if (item.type === 'switch' && item.storageKey) {
          acc[item.title] = debugOptions[item.storageKey]?.enabled ?? false;
        }
        return acc;
      },
      {} as Record<string, boolean>,
    );
    setSwitchOptions(newSwitchOptions);
  }, [debugOptions]);

  const handleToggleSwitch = (
    title: string,
    value: boolean,
    onPress: (value?: boolean) => void,
    storageKey?: AllowedKey,
  ) => {
    setSwitchOptions(prevState => ({ ...prevState, [title]: value }));
    if (storageKey) {
      onPress(value);
    }
  };

  const renderFooter = () => (
    <>
      <TwitchUsernameConverter />
      <DisplayAccessToken />
      <NavigateToChat />
    </>
  );

  const renderListFooter = useCallback(() => {
    return (
      <>
        <View style={[styles.sectionHeader, styles.storageState]}>
          <Text style={styles.sectionTitle}>Debug Options</Text>
          <Text style={styles.storageValue}>
            {JSON.stringify(debugOptions, null, 2)}
          </Text>
        </View>
        {renderFooter()}
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderListItem: ListRenderItem<DebugItem> = useCallback(({ item }) => {
    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.type === 'switch' ? (
            <Switch
              value={switchOptions[item.title] ?? false}
              onValueChange={value => {
                handleToggleSwitch(
                  item.title,
                  value,
                  item.onPress,
                  item.storageKey,
                );
              }}
            />
          ) : (
            <Button
              onPress={() => {
                item.onPress();
              }}
            >
              <Text>Clear</Text>
            </Button>
          )}
        </View>
        <Text variant="caption">{item.description}</Text>
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FlashList<DebugItem>
      data={debugItems}
      keyExtractor={item => item.title}
      renderItem={renderListItem}
      ListFooterComponent={renderListFooter}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

const styles = StyleSheet.create(theme => ({
  twitchSection: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  userId: {
    marginTop: theme.spacing.sm,
    fontWeight: 'bold',
  },
  storageState: {
    marginTop: theme.spacing.lg,
  },
  itemContainer: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontWeight: 'bold',
  },
  sectionHeader: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  storageValue: {
    color: theme.colors.lime,
  },
  button: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.brightPurple,
    color: theme.colors.text,
    borderRadius: theme.spacing.sm,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.md,
  },
  accessTokenContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.border,
  },
  accessTokenLabel: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  accessTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accessTokenValue: {
    flex: 1,
    marginRight: theme.spacing.sm,
    color: theme.colors.text,
  },
  copyButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.sm,
  },
  copyButtonText: {
    fontWeight: 'bold',
  },
  navigateToChatContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  loggedInUser: {
    marginTop: theme.spacing.sm,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
}));
