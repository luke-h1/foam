import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button as NativeButton,
  Form,
  Host,
  Section,
  Text as NativeText,
  TextField,
  Toggle,
} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { Button } from '@app/components/Button/Button';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Input } from '@app/components/ui/Input/Input';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useDebugOptions } from '@app/hooks/useDebugOptions';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { NAMESPACE, storageService } from '@app/lib/storage';
import { twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';

import { PaintRendererSection } from './components/PaintRendererSection';

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

  const [username, setUsername] = useState('');
  const [channelName, setChannelName] = useState('');
  const channelIdRef = useRef('');
  const reactQueryEnabled = debugOptions.ReactQueryDebug?.enabled ?? false;
  const scrollRef = useRef<ScrollView>(null);
  const accessToken = authState?.token?.accessToken ?? '';
  const tokenKind = authState?.isAnonAuth ? 'anon' : 'user';

  useScrollToTop(scrollRef);

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

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section
            title='Storage'
            footer={<NativeText>{`Wipe ${NAMESPACE}`}</NativeText>}
          >
            <Toggle
              isOn={reactQueryEnabled}
              onIsOnChange={handleToggleReactQueryDebug}
            >
              <NativeText>RQ DevTools</NativeText>
              <NativeText>Shows React Query debugger</NativeText>
            </Toggle>
            <NativeButton
              label='Copy storage state'
              systemImage='doc.on.doc'
              onPress={() => void handleCopyStorageState()}
            />
            <NativeButton
              label='Clear storage'
              systemImage='trash'
              // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
              role='destructive'
              onPress={handleClearDebugStorage}
            />
          </Section>

          <PaintRendererSection />

          <Section title='Username → ID'>
            <TextField
              placeholder='username'
              onTextChange={setUsername}
              modifiers={[
                autocorrectionDisabled(true),
                textInputAutocapitalization('never'),
              ]}
            />
            <NativeButton
              label='Copy user ID'
              systemImage='number'
              onPress={() => void handleConvertUsername()}
            />
          </Section>

          <Section
            title='Token'
            footer={
              <NativeText>
                {accessToken
                  ? `${tokenKind} · …${accessToken.slice(-16)}`
                  : 'No token available'}
              </NativeText>
            }
          >
            <NativeButton
              label='Copy access token'
              systemImage='key'
              onPress={() => void handleCopyToken()}
            />
          </Section>

          <Section
            title='Join channel'
            footer={
              user ? (
                <NativeText>{`logged in as ${user.display_name}`}</NativeText>
              ) : undefined
            }
          >
            <TextField
              placeholder='channel'
              onTextChange={setChannelName}
              modifiers={[
                autocorrectionDisabled(true),
                textInputAutocapitalization('never'),
              ]}
            />
            <NativeButton
              label='Join channel'
              systemImage='arrow.right.circle'
              onPress={handleJoinChannel}
            />
          </Section>
        </Form>
      </Host>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <KeyboardAvoidingView behavior='padding' style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          contentInsetAdjustmentBehavior='automatic'
          contentContainerStyle={styles.content}
          keyboardDismissMode='on-drag'
          keyboardShouldPersistTaps='handled'
        >
          <SettingsSection title='Storage'>
            <SettingsToggleRow
              title='RQ DevTools'
              subtitle='Shows React Query debugger'
              icon={{ icon: 'ladybug', color: theme.colorOrange }}
              value={reactQueryEnabled}
              onValueChange={handleToggleReactQueryDebug}
            />
            <SettingsLinkRow
              title='Copy storage state'
              icon={{ icon: 'doc.on.doc', color: theme.colorBlue }}
              onPress={() => void handleCopyStorageState()}
            />
            <SettingsLinkRow
              title='Clear storage'
              subtitle={`Wipe ${NAMESPACE}`}
              icon={{ icon: 'trash', color: theme.colorRed }}
              onPress={handleClearDebugStorage}
              danger
            />
          </SettingsSection>

          <PaintRendererSection />

          <SettingsSection title='Username → ID'>
            <View style={styles.inputRow}>
              <Input
                style={styles.input}
                placeholder='username'
                value={username}
                onChangeText={setUsername}
                autoCapitalize='none'
                autoCorrect={false}
                variant='outline'
                radius='sm'
              />
              <Button
                onPress={() => void handleConvertUsername()}
                style={styles.goBtn}
              >
                <Text type='sm' weight='semibold'>
                  copy
                </Text>
              </Button>
            </View>
          </SettingsSection>

          <SettingsSection
            title='Token'
            footer={
              <Text type='xs' color='gray.textLow'>
                {accessToken
                  ? `${tokenKind} · …${accessToken.slice(-16)}`
                  : 'No token available'}
              </Text>
            }
          >
            <SettingsLinkRow
              title='Copy access token'
              icon={{ icon: 'key', color: theme.colorTeal }}
              onPress={() => void handleCopyToken()}
            />
          </SettingsSection>

          <SettingsSection
            title='Join channel'
            footer={
              user ? (
                <Text type='xs' color='gray.textLow'>
                  {`logged in as ${user.display_name}`}
                </Text>
              ) : undefined
            }
          >
            <View style={styles.inputRow}>
              <Input
                style={styles.input}
                placeholder='channel'
                value={channelName}
                onChangeText={setChannelName}
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
          </SettingsSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
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
    paddingHorizontal: theme.space16,
  },
  input: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  iosHost: {
    flex: 1,
  },
  joinBtn: {
    alignItems: 'center',
    backgroundColor: theme.colorBlue,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
  joinBtnText: {
    color: '#fff',
  },
  screenContainer: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});
