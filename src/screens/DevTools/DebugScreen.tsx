import { Button } from '@app/components/Button/Button';
import { SymbolView } from 'expo-symbols';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/ui/Text/Text';
import { Input } from '@app/components/ui/Input/Input';
import { useAuthContext } from '@app/context/AuthContext';
import { useDebugOptions } from '@app/hooks/useDebugOptions';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { NAMESPACE, storageService } from '@app/lib/storage';
import { twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { useObservable, useSelector } from '@legendapp/state/react';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useCallback } from 'react';
import { Alert, Platform, ScrollView, View, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

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

export function DebugScreen() {
  const debugOptions = useDebugOptions();
  const { user, authState } = useAuthContext();

  const username$ = useObservable('');
  const channelName$ = useObservable('');
  const channelId$ = useObservable('');
  const reactQueryEnabled = debugOptions.ReactQueryDebug?.enabled ?? false;
  const username = useSelector(username$);
  const channelName = useSelector(channelName$);
  const channelId = useSelector(channelId$);
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  useEffect(() => {
    if (!channelName.trim()) {
      return;
    }
    const t = setTimeout(() => {
      void twitchService.getUser(channelName).then(r => channelId$.set(r.id));
    }, 400);
    return () => clearTimeout(t);
  }, [channelId$, channelName]);

  const handleUsernameChange = useCallback(
    (value: string) => username$.set(value),
    [username$],
  );

  const handleChannelNameChange = useCallback(
    (value: string) => channelName$.set(value),
    [channelName$],
  );

  const handleConvertUsername = async () => {
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
    router.push({
      pathname: '/chat',
      params: { channelName, channelId },
    });
  };

  return (
    <View style={styles.screenContainer}>
      <KeyboardAvoidingView
        behavior='padding'
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentInsetAdjustmentBehavior='automatic'
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps='handled'
        >
          {Platform.OS === 'ios' ? null : (
            <Text type='xl' weight='bold' style={styles.title}>
              Debug
            </Text>
          )}

          {/* Storage */}
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text weight='semibold'>Clear storage</Text>
              <Text type='xs' color='gray.textLow'>
                Wipe {NAMESPACE}
              </Text>
            </View>
            <Button
              onPress={handleClearDebugStorage}
              style={styles.destructiveBtn}
            >
              <Text type='sm' weight='semibold' color='red.accent'>
                Clear
              </Text>
            </Button>
          </View>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text weight='semibold'>RQ DevTools</Text>
              <Text type='xs' color='gray.textLow'>
                Shows React Query debugger
              </Text>
            </View>
            <Switch
              value={reactQueryEnabled}
              onValueChange={handleToggleReactQueryDebug}
            />
          </View>

          <View style={styles.divider} />

          {/* Username converter */}
          <Text weight='semibold' style={styles.label}>
            Username → ID
          </Text>
          <View style={styles.inputRow}>
            <Input
              style={styles.input}
              placeholder='username'
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize='none'
              autoCorrect={false}
              variant='outline'
              radius='sm'
            />
            <Button
              onPress={() => void handleConvertUsername()}
              style={styles.goBtn}
            >
              <SymbolView
                name='doc.on.doc'
                size={16}
                tintColor={theme.color.text.dark}
              />
            </Button>
          </View>

          <View style={styles.divider} />

          {/* Token */}
          <Text weight='semibold' style={styles.label}>
            Token{' '}
            <Text type='sm' color='gray.textLow'>
              ({authState?.isAnonAuth ? 'anon' : 'user'})
            </Text>
          </Text>
          <View style={styles.tokenBox}>
            <Text type='xs' numberOfLines={1} style={styles.tokenText}>
              {authState?.token?.accessToken ?? '—'}
            </Text>
            <Button
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onPress={handleCopyToken}
              style={styles.copyBtn}
            >
              <Text type='xs' weight='semibold'>
                copy
              </Text>
            </Button>
          </View>

          <View style={styles.divider} />

          {/* Join channel */}
          <Text weight='semibold' style={styles.label}>
            Join channel
          </Text>
          <View style={styles.inputRow}>
            <Input
              style={styles.input}
              placeholder='channel'
              value={channelName}
              onChangeText={handleChannelNameChange}
              autoCapitalize='none'
              autoCorrect={false}
              variant='outline'
              radius='sm'
            />
            <Button onPress={handleJoinChannel} style={styles.joinBtn}>
              <Text type='sm' weight='semibold' style={styles.joinBtnText}>
                Go
              </Text>
            </Button>
          </View>

          {user && (
            <Text type='xs' color='gray.textLow' style={styles.hint}>
              logged in as {user.display_name}
            </Text>
          )}

          <View style={styles.divider} />

          {/* Storage state */}
          <Text weight='semibold' style={styles.label}>
            Storage state
          </Text>
          <View style={styles.codeBlock}>
            <Text type='xs' style={styles.codeText}>
              {JSON.stringify(debugOptions, null, 2)}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  codeBlock: {
    backgroundColor: theme.color.background.darkAltAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    padding: theme.space16,
  },
  codeText: {
    color: theme.colorGrass,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  content: {
    padding: theme.space20,
    paddingBottom: 100,
  },
  copyBtn: {
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  destructiveBtn: {
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  divider: {
    backgroundColor: theme.colorBorderSecondary,
    height: 1,
    marginVertical: theme.space16,
  },
  flex: {
    flex: 1,
  },
  goBtn: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  hint: {
    marginTop: theme.space12,
  },
  inputFlex: {
    flex: 1,
  },
  input: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.space12,
  },
  joinBtn: {
    backgroundColor: theme.colorBlue,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
  joinBtnText: {
    color: '#fff',
  },
  label: {
    marginBottom: theme.space12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.space16,
  },
  rowText: {
    flex: 1,
  },
  screenContainer: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  title: {
    marginBottom: theme.space28,
  },
  tokenBox: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    flexDirection: 'row',
    gap: theme.space12,
    padding: theme.space12,
  },
  tokenText: {
    color: theme.color.text.dark,
    flex: 1,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
});
