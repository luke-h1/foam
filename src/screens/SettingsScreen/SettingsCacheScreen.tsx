import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import * as Form from '@app/components/Form/Form';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { storageService } from '@app/lib/storage';
import { clearChatCosmeticsCache } from '@app/store/chatStore/channelLoad';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { clearImageCache } from '@app/utils/image/clearImageCache';
import { queryClient } from '@app/utils/react-query/reacy-query';
import { Platform, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { useRef } from 'react';
import { toast } from 'sonner-native';
import { clearEmoteImageCache } from '@app/store/chatStore/emoteImages';

export function SettingsCacheScreen() {
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  const handleClearData = () => {
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
  };

  const handleClearChatCache = () => {
    Alert.alert(
      'Clear chat Cache',
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
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView contentContainerStyle={styles.iosContent}>
          <ScreenHeader
            title="Cache"
            subtitle="Reset cached app data"
            size="medium"
          />

          <Form.Section
            title="Danger Zone"
            footer="Use these only when stream metadata, badges, or emotes need a hard refresh."
          >
            <Form.Link
              systemImage="externaldrive.badge.minus"
              onPress={handleClearData}
            >
              Clear all cached data (will cause a logout)
            </Form.Link>
            <Form.Link systemImage="trash" onPress={handleClearChatCache}>
              Clear emote/badge/cosmetics cache
            </Form.Link>
          </Form.Section>
        </BodyScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ScreenHeader
          title="Cache"
          subtitle="Reset cached app data when streams, badges, or emotes need a clean refresh."
          size="medium"
        />

        <SettingsSection
          title="Danger Zone"
          footer={
            <Text type="xs" color="gray.textLow">
              These actions should be used for troubleshooting and hard
              refreshes, not routine cleanup.
            </Text>
          }
        >
          <SettingsLinkRow
            title="Clear Data"
            subtitle="Refetch stream, category, emote, and badge state"
            icon={{ icon: 'database', color: theme.colorRed }}
            onPress={handleClearData}
            danger
          />
          <SettingsLinkRow
            title="Clear Image Cache"
            subtitle="Remove locally cached emote and badge media"
            icon={{ icon: 'trash-2', color: theme.colorRed }}
            onPress={handleClearChatCache}
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
  iosContent: {
    paddingBottom: theme.space56,
  },
});
