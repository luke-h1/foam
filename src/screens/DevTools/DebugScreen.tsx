import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { Switch } from '@app/components/Switch';
import { TextField } from '@app/components/TextField';
import { Typography } from '@app/components/Typography';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { useDebugOptions } from '@app/hooks/useDebugOptions';
import { NAMESPACE, storageService } from '@app/services/storage-service';
import { twitchService } from '@app/services/twitch-service';
import * as Clipboard from 'expo-clipboard';
import { useState, useEffect } from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export function DebugScreen() {
  const { theme } = useUnistyles();
  const debugOptions = useDebugOptions();
  const { user, authState } = useAuthContext();
  const { navigate } = useAppNavigation();

  const [reactQueryEnabled, setReactQueryEnabled] = useState(false);
  const [username, setUsername] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelId, setChannelId] = useState('');

  useEffect(() => {
    setReactQueryEnabled(debugOptions.ReactQueryDebug?.enabled ?? false);
  }, [debugOptions]);

  useEffect(() => {
    if (!channelName.trim()) return;
    const t = setTimeout(() => {
      void twitchService.getUser(channelName).then(r => setChannelId(r.id));
    }, 400);
    return () => clearTimeout(t);
  }, [channelName]);

  const handleClearStorage = () => {
    Alert.alert('Clear storage?', `This will wipe ${NAMESPACE}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => storageService.clear(),
      },
    ]);
  };

  const handleToggleRQ = (val: boolean) => {
    setReactQueryEnabled(val);
    storageService.set('ReactQueryDebug', val);
  };

  const handleConvertUsername = async () => {
    if (!username.trim()) return;
    try {
      const res = await twitchService.getUser(username);
      await Clipboard.setStringAsync(res.id);
      Alert.alert('Copied', res.id);
    } catch {
      Alert.alert('Not found');
    }
  };

  const handleCopyToken = async () => {
    if (authState?.token?.accessToken) {
      await Clipboard.setStringAsync(authState.token.accessToken);
    }
  };

  const handleJoinChannel = () => {
    if (!channelName.trim()) {
      return;
    }
    navigate('Chat', { channelName, channelId });
  };

  return (
    <View style={styles.screenContainer}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Typography size="xl" fontWeight="bold" style={styles.title}>
            Debug
          </Typography>

          {/* Storage */}
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Typography fontWeight="semiBold">Clear storage</Typography>
              <Typography size="xs" color="gray.textLow">
                Wipe {NAMESPACE}
              </Typography>
            </View>
            <Button onPress={handleClearStorage} style={styles.destructiveBtn}>
              <Typography size="sm" fontWeight="semiBold" color="red.accent">
                Clear
              </Typography>
            </Button>
          </View>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Typography fontWeight="semiBold">RQ DevTools</Typography>
              <Typography size="xs" color="gray.textLow">
                Shows React Query debugger
              </Typography>
            </View>
            <Switch value={reactQueryEnabled} onValueChange={handleToggleRQ} />
          </View>

          <View style={styles.divider} />

          {/* Username converter */}
          <Typography fontWeight="semiBold" style={styles.label}>
            Username → ID
          </Typography>
          <View style={styles.inputRow}>
            <TextField
              placeholder="username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.inputFlex}
            />
            <Button
              onPress={() => void handleConvertUsername()}
              style={styles.goBtn}
            >
              <Icon icon="copy" size={16} color={theme.colors.gray.text} />
            </Button>
          </View>

          <View style={styles.divider} />

          {/* Token */}
          <Typography fontWeight="semiBold" style={styles.label}>
            Token{' '}
            <Typography size="sm" color="gray.textLow">
              ({authState?.isAnonAuth ? 'anon' : 'user'})
            </Typography>
          </Typography>
          <View style={styles.tokenBox}>
            <Typography size="xs" numberOfLines={1} style={styles.tokenText}>
              {authState?.token?.accessToken ?? '—'}
            </Typography>
            <Button
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onPress={handleCopyToken}
              style={styles.copyBtn}
            >
              <Typography size="xs" fontWeight="semiBold">
                copy
              </Typography>
            </Button>
          </View>

          <View style={styles.divider} />

          {/* Join channel */}
          <Typography fontWeight="semiBold" style={styles.label}>
            Join channel
          </Typography>
          <View style={styles.inputRow}>
            <TextField
              placeholder="channel"
              value={channelName}
              onChangeText={setChannelName}
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.inputFlex}
            />
            <Button onPress={handleJoinChannel} style={styles.joinBtn}>
              <Typography
                size="sm"
                fontWeight="semiBold"
                style={styles.joinBtnText}
              >
                Go
              </Typography>
            </Button>
          </View>

          {user && (
            <Typography size="xs" color="gray.textLow" style={styles.hint}>
              logged in as {user.display_name}
            </Typography>
          )}

          <View style={styles.divider} />

          {/* Storage state */}
          <Typography fontWeight="semiBold" style={styles.label}>
            Storage state
          </Typography>
          <View style={styles.codeBlock}>
            <Typography size="xs" style={styles.codeText}>
              {JSON.stringify(debugOptions, null, 2)}
            </Typography>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  title: {
    marginBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  rowText: {
    flex: 1,
  },
  destructiveBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray.borderAlpha,
    marginVertical: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  inputFlex: {
    flex: 1,
  },
  goBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderRadius: theme.radii.sm,
  },
  tokenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray.bgAltAlpha,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  tokenText: {
    flex: 1,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    color: theme.colors.gray.text,
  },
  copyBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  joinBtn: {
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.blue.accent,
    borderRadius: theme.radii.sm,
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#fff',
  },
  hint: {
    marginTop: theme.spacing.sm,
  },
  codeBlock: {
    backgroundColor: theme.colors.gray.bgAltAlpha,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md,
  },
  codeText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    color: theme.colors.grass.accent,
  },
}));
