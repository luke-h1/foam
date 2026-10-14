import { Platform } from 'react-native';

import { Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';

import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preference-store';
import { isDevToolsEnabled } from '@app/utils/dev-tools/is-dev-tools-enabled';
import { isNativeChatListAvailable } from '@modules/native-chat-list/src/NativeChatListView';

/**
 * Switches chat between the LegendList rows and the experimental UIKit list.
 * iOS only, and only in builds that include the native module.
 */
export function NativeChatListSection() {
  const nativeChatList = usePreference('nativeChatList');
  const update = useUpdatePreferences();

  if (!isDevToolsEnabled || Platform.OS !== 'ios') {
    return null;
  }

  return (
    <Section
      title='Native Chat List'
      footer={
        <NativeText>
          {isNativeChatListAvailable
            ? 'Draws chat rows with UIKit instead of React Native. Experimental.'
            : 'This build does not include the native chat list module. Rebuild the dev client.'}
        </NativeText>
      }
    >
      <Toggle
        isOn={nativeChatList}
        onIsOnChange={value => update({ nativeChatList: value })}
      >
        <NativeText>UIKit chat list</NativeText>
      </Toggle>
    </Section>
  );
}
