import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import * as Form from '@app/components/Form/Form';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
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
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
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
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.iosContent}
        >
          <Form.Section footer="Use these when stream metadata, badges, emotes, or downloaded chat media need a hard refresh.">
            <CacheActionRow
              custom
              icon="externaldrive"
              title="Clear Local Data"
              subtitle="Signs you out, clears stored app data, and forces fresh stream fetches next time."
              onPress={handleClearData}
            />
            <CacheActionRow
              custom
              icon="trash"
              title="Clear Chat Media Cache"
              subtitle="Removes downloaded emotes, badges, cosmetics, and image cache entries from this device."
              onPress={handleClearChatCache}
            />
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
            subtitle="Sign out and refetch stream, category, emote, and badge state"
            icon={{ icon: 'externaldrive', color: theme.colorRed }}
            onPress={handleClearData}
            danger
          />
          <SettingsLinkRow
            title="Clear Image Cache"
            subtitle="Remove downloaded emote, badge, cosmetic, and image cache entries"
            icon={{ icon: 'trash', color: theme.colorRed }}
            onPress={handleClearChatCache}
            danger
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

function CacheActionRow({
  custom: _custom,
  icon,
  title,
  subtitle,
  onPress,
}: {
  custom?: true;
  icon: SymbolViewProps['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <PressableArea
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
    >
      <View style={styles.iosActionRow}>
        <View style={styles.iosActionIcon}>
          <SymbolView name={icon} tintColor={theme.colorRed} size={18} />
        </View>
        <View style={styles.iosActionCopy}>
          <Text color="gray" weight="semibold">
            {title}
          </Text>
          <Text color="gray.textLow" type="xs">
            {subtitle}
          </Text>
        </View>
      </View>
    </PressableArea>
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
  iosActionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 68,
    paddingHorizontal: 20,
    paddingVertical: theme.space12,
  },
  iosActionIcon: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    marginTop: 2,
    width: 24,
  },
  iosActionCopy: {
    flex: 1,
    gap: theme.space4,
    minWidth: 0,
  },
});
