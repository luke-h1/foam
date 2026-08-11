import { useRef } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  Button,
  Form,
  Host,
  Section,
  Text as NativeText,
} from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';
import { toast } from 'sonner-native';

import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { queryClient } from '@app/lib/react-query/query-client';
import { storageService } from '@app/lib/storage';
import { clearChatCosmeticsCache } from '@app/store/chat/actions/channelLoad';
import { theme } from '@app/styles/themes';
import { clearImageCache } from '@app/utils/image/clearImageCache';

function handleClearData() {
  Alert.alert(
    'Clear Local Data',
    'This clears cached app data and forces fresh fetches the next time screens load.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          storageService.clear();
          queryClient.clear();
          toast.success('Local data cleared');
        },
      },
    ],
  );
}

function handleClearCache() {
  Alert.alert(
    'Clear Cache',
    'This removes all cached emotes, badges, 7TV cosmetics, and downloaded media from this device. They will be fetched again as needed.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearChatCosmeticsCache();
          storageService.clearImageCache();
          void clearImageCache().then(() => {
            toast.success('Cache cleared');
          });
        },
      },
    ],
  );
}

export function SettingsCacheScreen() {
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section
            title='Danger Zone'
            footer={
              <NativeText>
                Use these when stream metadata, badges, emotes, or downloaded
                chat media need a hard refresh.
              </NativeText>
            }
            modifiers={[tint('red')]}
          >
            <Button
              label='Clear Local Data'
              systemImage='externaldrive'
              // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
              role='destructive'
              onPress={handleClearData}
            />
            <Button
              label='Clear Cache'
              systemImage='trash'
              // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
              role='destructive'
              onPress={handleClearCache}
            />
          </Section>
        </Form>
      </Host>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={styles.content}
      >
        <SettingsSection
          title='Danger Zone'
          footer={
            <Text type='xs' color='gray.textLow'>
              These actions should be used for troubleshooting and hard
              refreshes, not routine cleanup.
            </Text>
          }
        >
          <SettingsLinkRow
            title='Clear Data'
            subtitle='Sign out and refetch stream, category, emote, and badge state'
            icon={{ icon: 'externaldrive', color: theme.colorRed }}
            onPress={handleClearData}
            danger
          />
          <SettingsLinkRow
            title='Clear Cache'
            subtitle='Remove cached emotes, badges, 7TV cosmetics, and downloaded images'
            icon={{ icon: 'trash', color: theme.colorRed }}
            onPress={handleClearCache}
            danger
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  iosHost: {
    flex: 1,
  },
});
