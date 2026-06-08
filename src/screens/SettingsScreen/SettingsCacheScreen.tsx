import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { storageService } from '@app/lib/storage';
import { clearChatCosmeticsCache } from '@app/store/chat/actions/channelLoad';
import { clearUserCosmeticsCache } from '@app/store/chat/actions/cosmetics';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { clearImageCache } from '@app/utils/image/clearImageCache';
import { queryClient } from '@app/utils/react-query/queryClient';
import {
  Button,
  Form,
  Host,
  Section,
  Text as NativeText,
} from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { toast } from 'sonner-native';
import { clearEmoteImageCache } from '@app/store/chat/actions/emoteImages';

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

function handleClearChatCache() {
  Alert.alert(
    'Clear Chat Cache',
    'This removes cached emotes, badges, and other downloaded media from this device.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearChatCosmeticsCache();
          clearEmoteImageCache();
          storageService.clearImageCache();
          void clearImageCache().then(() => {
            toast.success('Chat cache cleared');
          });
        },
      },
    ],
  );
}

function handleClearSevenTvCosmeticsCache() {
  Alert.alert(
    'Clear 7TV Cosmetic Cache',
    'This removes cached 7TV user paints and badges. They will be fetched again as users appear in chat.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearUserCosmeticsCache();
          toast.success('7TV cosmetic cache cleared');
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
              label='Clear Chat Media Cache'
              systemImage='trash'
              // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
              role='destructive'
              onPress={handleClearChatCache}
            />
            <Button
              label='Clear 7TV Cosmetic Cache'
              systemImage='sparkles'
              // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
              role='destructive'
              onPress={handleClearSevenTvCosmeticsCache}
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
        showsVerticalScrollIndicator={false}
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
            title='Clear Image Cache'
            subtitle='Remove downloaded emote, badge, cosmetic, and image cache entries'
            icon={{ icon: 'trash', color: theme.colorRed }}
            onPress={handleClearChatCache}
            danger
          />

          <SettingsLinkRow
            title='Clear 7TV Cosmetic Cache'
            subtitle='Remove cached 7TV paints and badges for chat users'
            icon={{ icon: 'sparkles', color: theme.colorRed }}
            onPress={handleClearSevenTvCosmeticsCache}
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
