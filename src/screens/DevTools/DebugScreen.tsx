import { Screen, Typography, Button, TextField } from '@app/components';
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

  const { styles } = useStyles(stylesheet);
  const [twitchUsername, setTwitchUsername] = useState<string>('');
  const [twitchUserId, setTwitchUserId] = useState<string>('');

  const [storageState, setStorageState] = useState<Record<string, string>>({});
  const [switchOptions, setSwitchOptions] = useState<Record<string, boolean>>(
    {},
  );

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

    const newSwitchOptions = debugItems.reduce(
      (acc, item) => {
        if (item.type === 'switch' && item.storageKey) {
          acc[item.title] = state[item.storageKey] === 'true';
        }
        return acc;
      },
      {} as Record<string, boolean>,
    );
    setSwitchOptions(newSwitchOptions);
  };

  useEffect(() => {
    fetchStorageState();
  }, []);

  const handleToggleSwitch = async (
    title: string,
    value: boolean,
    // eslint-disable-next-line no-shadow
    onPress: (value?: boolean) => void,
    storageKey?: AllowedKey,
  ) => {
    setSwitchOptions(prevState => ({ ...prevState, [title]: value }));
    if (storageKey) {
      onPress(value);
      setStorageState(prevState => ({
        ...prevState,
        [storageKey]: value.toString(),
      }));
    }
  };

  return (
    <Screen preset="scroll">
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
                    setStorageState({});
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
          <View>
            <View style={[styles.sectionHeader, styles.storageState]}>
              <Typography style={styles.sectionTitle}>
                AsyncStorage State
              </Typography>
              <Typography style={styles.storageValue}>
                {JSON.stringify(storageState, null, 2)}
              </Typography>
            </View>
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
              <Button
                onPress={async () => {
                  const result = await twitchService.getUser(twitchUsername);
                  setTwitchUserId(result.id);
                  await Clipboard.setStringAsync(twitchUserId);
                }}
                style={styles.button}
              >
                <Typography>Convert and Copy</Typography>
              </Button>
              {twitchUserId ? (
                <Typography style={styles.userId}>
                  User ID: {twitchUserId}
                </Typography>
              ) : null}
            </View>
          </View>
        }
      />
    </Screen>
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
  storageItem: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storageKey: {
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
}));
