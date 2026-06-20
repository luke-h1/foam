import { Button } from '@app/components/Button/Button';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { Input } from '@app/components/ui/Input/Input';
import { useAuthContext } from '@app/context/AuthContext';
import { useDebugOptions } from '@app/hooks/useDebugOptions';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { NAMESPACE, storageService } from '@app/lib/storage';
import { twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
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
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Platform, ScrollView, View, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';
import { useTranslation } from 'react-i18next';
import i18next from '@app/i18n/i18next';

function handleClearDebugStorage() {
  Alert.alert(
    i18next.t('devTools:clearStorageConfirm'),
    i18next.t('devTools:clearStorageMessage', { namespace: NAMESPACE }),
    [
      { text: i18next.t('common:cancel'), style: 'cancel' },
      {
        text: i18next.t('devTools:clear'),
        style: 'destructive',
        onPress: () => storageService.clear(),
      },
    ],
  );
}

function handleToggleReactQueryDebug(val: boolean) {
  storageService.set('ReactQueryDebug', val);
}

export function DebugScreen() {
  const { t } = useTranslation('devTools');
  const debugOptions = useDebugOptions();
  const { user, authState } = useAuthContext();

  const [username, setUsername] = useState('');
  const [channelName, setChannelName] = useState('');
  const channelIdRef = useRef('');
  const reactQueryEnabled = debugOptions.ReactQueryDebug?.enabled ?? false;
  const scrollRef = useRef<ScrollView>(null);
  const accessToken = authState?.token?.accessToken ?? '';
  const tokenKind = authState?.isAnonAuth ? t('anon') : t('user');

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
      Alert.alert(i18next.t('devTools:copied'), res.id);
    } catch {
      Alert.alert(i18next.t('devTools:notFound'));
    }
  }, [username]);

  const handleCopyToken = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    await Clipboard.setStringAsync(accessToken);
    toast.success(i18next.t('devTools:copied'));
  }, [accessToken]);

  const handleCopyStorageState = useCallback(async () => {
    await Clipboard.setStringAsync(JSON.stringify(debugOptions, null, 2));
    toast.success(i18next.t('devTools:storageStateCopied'));
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
            title={t('storage')}
            footer={
              <NativeText>
                {t('wipeNamespace', { namespace: NAMESPACE })}
              </NativeText>
            }
          >
            <Toggle
              isOn={reactQueryEnabled}
              onIsOnChange={handleToggleReactQueryDebug}
            >
              <NativeText>{t('rqDevTools')}</NativeText>
              <NativeText>{t('rqDevToolsDescription')}</NativeText>
            </Toggle>
            <NativeButton
              label={t('copyStorageState')}
              systemImage='doc.on.doc'
              onPress={() => void handleCopyStorageState()}
            />
            <NativeButton
              label={t('clearStorage')}
              systemImage='trash'
              // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
              role='destructive'
              onPress={handleClearDebugStorage}
            />
          </Section>

          <Section title={t('usernameToId')}>
            <TextField
              placeholder={t('usernamePlaceholder')}
              onTextChange={setUsername}
              modifiers={[
                autocorrectionDisabled(true),
                textInputAutocapitalization('never'),
              ]}
            />
            <NativeButton
              label={t('copyUserId')}
              systemImage='number'
              onPress={() => void handleConvertUsername()}
            />
          </Section>

          <Section
            title={t('token')}
            footer={
              <NativeText>
                {accessToken
                  ? `${tokenKind} · …${accessToken.slice(-16)}`
                  : t('noToken')}
              </NativeText>
            }
          >
            <NativeButton
              label={t('copyToken')}
              systemImage='key'
              onPress={() => void handleCopyToken()}
            />
          </Section>

          <Section
            title={t('joinChannel')}
            footer={
              user ? (
                <NativeText>
                  {t('loggedInAs', { name: user.display_name })}
                </NativeText>
              ) : undefined
            }
          >
            <TextField
              placeholder={t('channelPlaceholderShort')}
              onTextChange={setChannelName}
              modifiers={[
                autocorrectionDisabled(true),
                textInputAutocapitalization('never'),
              ]}
            />
            <NativeButton
              label={t('joinChannel')}
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
          <SettingsSection title={t('storage')}>
            <SettingsToggleRow
              title={t('rqDevTools')}
              subtitle={t('rqDevToolsDescription')}
              icon={{ icon: 'ladybug', color: theme.colorOrange }}
              value={reactQueryEnabled}
              onValueChange={handleToggleReactQueryDebug}
            />
            <SettingsLinkRow
              title={t('copyStorageState')}
              icon={{ icon: 'doc.on.doc', color: theme.colorBlue }}
              onPress={() => void handleCopyStorageState()}
            />
            <SettingsLinkRow
              title={t('clearStorage')}
              subtitle={t('wipeNamespace', { namespace: NAMESPACE })}
              icon={{ icon: 'trash', color: theme.colorRed }}
              onPress={handleClearDebugStorage}
              danger
            />
          </SettingsSection>

          <SettingsSection title={t('usernameToId')}>
            <View style={styles.inputRow}>
              <Input
                style={styles.input}
                placeholder={t('usernamePlaceholder')}
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
                  {t('copy')}
                </Text>
              </Button>
            </View>
          </SettingsSection>

          <SettingsSection
            title={t('token')}
            footer={
              <Text type='xs' color='gray.textLow'>
                {accessToken
                  ? `${tokenKind} · …${accessToken.slice(-16)}`
                  : t('noToken')}
              </Text>
            }
          >
            <SettingsLinkRow
              title={t('copyToken')}
              icon={{ icon: 'key', color: theme.colorTeal }}
              onPress={() => void handleCopyToken()}
            />
          </SettingsSection>

          <SettingsSection
            title={t('joinChannel')}
            footer={
              user ? (
                <Text type='xs' color='gray.textLow'>
                  {t('loggedInAs', { name: user.display_name })}
                </Text>
              ) : undefined
            }
          >
            <View style={styles.inputRow}>
              <Input
                style={styles.input}
                placeholder={t('channelPlaceholderShort')}
                value={channelName}
                onChangeText={setChannelName}
                autoCapitalize='none'
                autoCorrect={false}
                variant='outline'
                radius='sm'
              />
              <Button onPress={handleJoinChannel} style={styles.joinBtn}>
                <Text type='sm' weight='semibold' style={styles.joinBtnText}>
                  {t('go')}
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
