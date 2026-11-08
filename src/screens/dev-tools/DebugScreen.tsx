import { useRef } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Button } from '@app/components/button/Button';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/SettingsSection';
import { Input } from '@app/components/ui/input/Input';
import { Text } from '@app/components/ui/text/Text';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { NAMESPACE } from '@app/lib/storage';
import { theme } from '@app/styles/themes';

import { PaintRendererSection } from './components/PaintRendererSection';
import { useDebugScreenState } from './hooks/use-debug-screen-state';

export function DebugScreen() {
  const scrollRef = useRef<ScrollViewInstance>(null);

  const {
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
  } = useDebugScreenState();

  useScrollToTop(scrollRef);

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
              icon={{ icon: 'ladybug' }}
              value={reactQueryEnabled}
              onValueChange={handleToggleReactQueryDebug}
            />
            <SettingsLinkRow
              title='Copy storage state'
              icon={{ icon: 'doc.on.doc' }}
              onPress={() => void handleCopyStorageState()}
            />
            <SettingsLinkRow
              title='Clear storage'
              subtitle={`Wipe ${NAMESPACE}`}
              icon={{ icon: 'trash' }}
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
                <Text type='body' weight='semibold'>
                  copy
                </Text>
              </Button>
            </View>
          </SettingsSection>

          <SettingsSection
            title='Token'
            footer={
              <Text type='subhead' color='gray.textLow'>
                {accessToken
                  ? `${tokenKind} · …${accessToken.slice(-16)}`
                  : 'No token available'}
              </Text>
            }
          >
            <SettingsLinkRow
              title='Copy access token'
              icon={{ icon: 'key' }}
              onPress={() => void handleCopyToken()}
            />
          </SettingsSection>

          <SettingsSection
            title='Join channel'
            footer={
              user ? (
                <Text type='subhead' color='gray.textLow'>
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
                <Text type='body' weight='semibold' style={styles.joinBtnText}>
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
    borderRadius: theme.radius.md,
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
  joinBtn: {
    alignItems: 'center',
    backgroundColor: theme.colorBlue,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
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
