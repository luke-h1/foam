import { Screen, Typography, Button } from '@app/components';
import { useAppNavigation, useHeader, useDebugOptions } from '@app/hooks';
import { AllowedKey, storageService } from '@app/services';
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
  const debugOptions = useDebugOptions();

  useHeader({
    title: 'Debug',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });

  const { styles } = useStyles(stylesheet);

  const handleToggleSwitch = async (
    switchValue: boolean,
    onPress: (value?: boolean) => Promise<void>,
  ) => {
    await onPress(switchValue);
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
                  value={
                    item.storageKey
                      ? debugOptions[item.storageKey]?.enabled
                      : false
                  }
                  onValueChange={async value => {
                    await handleToggleSwitch(value, item.onPress);
                  }}
                />
              ) : (
                <Button
                  onPress={async () => {
                    await item.onPress();
                  }}
                  style={styles.button}
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
            <Typography style={styles.sectionTitle}>Debug Options</Typography>
            <Typography style={styles.storageValue}>
              {JSON.stringify(debugOptions, null, 2)}
            </Typography>
          </View>
        }
      />
    </Screen>
  );
}

const stylesheet = createStyleSheet(theme => ({
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
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.error,
    color: theme.colors.text,
    borderRadius: theme.spacing.lg,
  },
}));
