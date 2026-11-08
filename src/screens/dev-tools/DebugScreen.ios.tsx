import { StyleSheet } from 'react-native';

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

import { NAMESPACE } from '@app/lib/storage';

import { PaintRendererSection } from './components/PaintRendererSection';
import { useDebugScreenState } from './hooks/use-debug-screen-state';

export function DebugScreen() {
  const {
    user,
    setUsername,
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

  return (
    <Host style={styles.host}>
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
            // oxlint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
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

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
