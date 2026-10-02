import { useRef } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  Button,
  Form,
  Host,
  Section,
  Text as NativeText,
} from '@expo/ui/swift-ui';
import { toast } from 'sonner-native';

import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/settings-section/settings-section';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { queryClient } from '@app/lib/react-query/query-client';
import { storageService } from '@app/lib/storage';
import { clearChatCosmeticsCache } from '@app/store/chat/actions/channel-load';
import { theme } from '@app/styles/themes';
import { clearImageCache } from '@app/utils/image/clear-image-cache';

function handleClearData() {
  Alert.alert(
    'Clear saved data?',
    'Foam will remove the data it keeps on this device and load everything fresh. You stay signed in.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          storageService.clear();
          queryClient.clear();
          toast.success('Saved data cleared');
        },
      },
    ],
  );
}

function handleClearCache() {
  Alert.alert(
    'Clear cache?',
    'Cached emotes, badges, 7TV cosmetics and images will download again when needed.',
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
            footer={
              <NativeText>
                Removes cached emotes, badges, 7TV cosmetics and images. They
                download again when needed.
              </NativeText>
            }
          >
            <Button
              label='Clear cache'
              systemImage='trash'
              // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
              role='destructive'
              onPress={handleClearCache}
            />
          </Section>
          <Section
            footer={
              <NativeText>
                Removes the data Foam keeps on this device and loads everything
                fresh. You stay signed in.
              </NativeText>
            }
          >
            <Button
              label='Clear saved data'
              systemImage='externaldrive'
              // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
              role='destructive'
              onPress={handleClearData}
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
        <SettingsSection>
          <SettingsLinkRow
            title='Clear cache'
            subtitle='Emotes, badges, 7TV cosmetics and images download again when needed'
            icon={{ icon: 'trash' }}
            onPress={handleClearCache}
            danger
          />
          <SettingsLinkRow
            title='Clear saved data'
            subtitle='Loads everything fresh. You stay signed in'
            icon={{ icon: 'externaldrive' }}
            onPress={handleClearData}
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
    paddingHorizontal: theme.space16,
    paddingTop: theme.space16,
  },
  iosHost: {
    flex: 1,
  },
});
