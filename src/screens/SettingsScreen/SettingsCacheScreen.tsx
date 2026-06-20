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
import { queryClient } from '@app/lib/react-query/query-client';
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
import { useTranslation } from 'react-i18next';
import i18next from '@app/i18n/i18next';

function handleClearData() {
  Alert.alert(
    i18next.t('settings:clearLocalData'),
    i18next.t('settings:clearLocalDataConfirm'),
    [
      { text: i18next.t('common:cancel'), style: 'cancel' },
      {
        text: i18next.t('settings:clear'),
        style: 'destructive',
        onPress: () => {
          storageService.clear();
          queryClient.clear();
          toast.success(i18next.t('settings:localDataCleared'));
        },
      },
    ],
  );
}

function handleClearCache() {
  Alert.alert(
    i18next.t('settings:clearCacheTitle'),
    i18next.t('settings:clearCacheConfirm'),
    [
      { text: i18next.t('common:cancel'), style: 'cancel' },
      {
        text: i18next.t('settings:clear'),
        style: 'destructive',
        onPress: () => {
          clearChatCosmeticsCache();
          clearUserCosmeticsCache();
          clearEmoteImageCache();
          storageService.clearImageCache();
          void clearImageCache().then(() => {
            toast.success(i18next.t('settings:cacheCleared'));
          });
        },
      },
    ],
  );
}

export function SettingsCacheScreen() {
  const { t } = useTranslation('settings');
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section
            title={t('dangerZone')}
            footer={<NativeText>{t('cacheFooterIos')}</NativeText>}
            modifiers={[tint('red')]}
          >
            <Button
              label={t('clearLocalData')}
              systemImage='externaldrive'
              // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
              role='destructive'
              onPress={handleClearData}
            />
            <Button
              label={t('clearCache')}
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SettingsSection
          title={t('dangerZone')}
          footer={
            <Text type='xs' color='gray.textLow'>
              {t('cacheFooter')}
            </Text>
          }
        >
          <SettingsLinkRow
            title={t('clearData')}
            subtitle={t('clearDataDescription')}
            icon={{ icon: 'externaldrive', color: theme.colorRed }}
            onPress={handleClearData}
            danger
          />
          <SettingsLinkRow
            title={t('clearCache')}
            subtitle={t('clearCacheDescription')}
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
