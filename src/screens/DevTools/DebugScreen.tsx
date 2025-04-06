/* eslint-disable no-shadow */
import { Screen, Typography, Button, TextField } from '@app/components';
import { useAuthContext } from '@app/context';
import { useAppNavigation, useHeader } from '@app/hooks';
import { AllowedKey, storageService, twitchService } from '@app/services';
import * as Clipboard from 'expo-clipboard';
import { useState, useEffect } from 'react';
import { FlatList, Switch, View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

type DebugItem = {
  title: string;
  description: string;
  onPress: (value?: boolean) => Promise<void>;
  type: 'button' | 'switch';
  storageKey?: AllowedKey;
};

const debugItems: DebugItem[] = [
  {
    title: 'Clear async storage',
    description: 'Clear all items',
    onPress: async () => {
      storageService.clear();
    },
    type: 'button',
  },
  {
    title: 'Enable React Query DevTools',
    description: 'Enable the React Query DevTools for debugging queries.',
    storageKey: 'ReactQueryDebug',
    onPress: async (value?: boolean) => {
      return storageService.set('ReactQueryDebug', value);
    },
    type: 'switch',
  },
];

export function DebugScreen() {
  const { goBack } = useAppNavigation();

  useHeader({
    title: 'Debug',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });

  const [storageState, setStorageState] = useState<Record<string, string>>({});

  const fetchStorageState = () => {
    const entries = storageService.multiGet<[boolean]>(['ReactQueryDebug']);
    const state = entries.reduce(
      (acc, [key, value]) => {
        acc[key] = value === null ? 'false' : value.toString();
        return acc;
      },
      {} as Record<string, string>,
    );

    setStorageState(state);
  };

  useEffect(() => {
    fetchStorageState();
  }, []);

  return (
    <Screen preset="scroll">
      <DebugSettingsList
        debugItems={debugItems}
        storageState={storageState}
        fetchStorageState={fetchStorageState}
      />
      <TwitchUsernameConverter />
      <DisplayAccessToken />
    </Screen>
  );
}

function DebugSettingsList({
  debugItems,
  storageState,
  fetchStorageState,
}: {
  debugItems: DebugItem[];
  storageState: Record<string, string>;
  fetchStorageState: () => void;
}) {
  const { styles } = useStyles(stylesheet);
  const [switchOptions, setSwitchOptions] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const newSwitchOptions = debugItems.reduce(
      (acc, item) => {
        if (item.type === 'switch' && item.storageKey) {
          acc[item.title] = storageState[item.storageKey] === 'true';
        }
        return acc;
      },
      {} as Record<string, boolean>,
    );
    setSwitchOptions(newSwitchOptions);
  }, [storageState, debugItems]);

  const handleToggleSwitch = async (
    title: string,
    value: boolean,
    onPress: (value?: boolean) => void,
    storageKey?: AllowedKey,
  ) => {
    setSwitchOptions(prevState => ({ ...prevState, [title]: value }));
    if (storageKey) {
      onPress(value);
      fetchStorageState();
    }
  };

  return (
    <FlatList
      data={debugItems}
      keyExtractor={item => item.title}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <Typography style={styles.itemTitle}>{item.title}</Typography>
            {item.type === 'switch' ? (
              <Switch
                value={switchOptions[item.title]}
                onValueChange={async value => {
                  await handleToggleSwitch(
                    item.title,
                    value,
                    item.onPress,
                    item.storageKey,
                  );
                }}
              />
            ) : (
              <Button
                onPress={async () => {
                  await item.onPress();
                  fetchStorageState();
                }}
              >
                <Typography>Clear</Typography>
              </Button>
            )}
          </View>
          <Typography size="xs">{item.description}</Typography>
        </View>
      )}
      ListFooterComponent={
        <View style={[styles.sectionHeader, styles.storageState]}>
          <Typography style={styles.sectionTitle}>
            AsyncStorage State
          </Typography>
          <Typography style={styles.storageValue}>
            {JSON.stringify(storageState, null, 2)}
          </Typography>
        </View>
      }
    />
  );
}

function TwitchUsernameConverter() {
  const { styles } = useStyles(stylesheet);
  const [twitchUsername, setTwitchUsername] = useState<string>('');
  const [twitchUserId, setTwitchUserId] = useState<string>('');

  const handleConvertAndCopy = async () => {
    const result = await twitchService.getUser(twitchUsername);
    setTwitchUserId(result.id);
    await Clipboard.setStringAsync(result.id);
  };

  return (
    <View style={styles.twitchSection}>
      <Typography style={styles.sectionTitle}>
        Convert Twitch Username to User ID
      </Typography>
      <TextField
        placeholder="Enter Twitch username"
        value={twitchUsername}
        onChangeText={setTwitchUsername}
        style={styles.input}
      />
      <Button onPress={handleConvertAndCopy} style={styles.button}>
        <Typography>Convert and Copy</Typography>
      </Button>
      {twitchUserId ? (
        <Typography style={styles.userId}>User ID: {twitchUserId}</Typography>
      ) : null}
    </View>
  );
}

function DisplayAccessToken() {
  const { styles } = useStyles(stylesheet);
  const { authState } = useAuthContext();

  const handleCopyToClipboard = async () => {
    if (authState?.token.accessToken) {
      await Clipboard.setStringAsync(authState.token.accessToken);
    }
  };

  return (
    <View style={styles.accessTokenContainer}>
      <Typography style={styles.accessTokenLabel}>
        Auth Token ({authState?.isAnonAuth ? 'ANON' : 'USER'}):
      </Typography>
      <View style={styles.accessTokenRow}>
        <Typography style={styles.accessTokenValue} numberOfLines={1}>
          {authState?.token.accessToken || 'No token available'}
        </Typography>
        {authState?.token.accessToken && (
          <Button onPress={handleCopyToClipboard} style={styles.copyButton}>
            <Typography style={styles.copyButtonText}>Copy</Typography>
          </Button>
        )}
      </View>
    </View>
  );
}
const stylesheet = createStyleSheet(theme => ({
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
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
    backgroundColor: theme.colors.error,
    color: theme.colors.text,
    borderRadius: theme.spacing.lg,
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
}));
