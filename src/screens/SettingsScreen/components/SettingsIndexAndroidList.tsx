import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { openLicenseList } from '@app/lib/legal';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

import { BuildStatus } from './BuildStatus';
import type { SettingsIndexSharedProps } from './SettingsIndexIosForm';

export function SettingsIndexAndroidList({
  isLoggedIn,
  shouldShowDevTools,
  statusPageUrl,
  websiteUrl,
  canSeeUpdateAppButton,
  openStore,
  updateBundle,
  onSendFeedback,
  scrollRef,
}: SettingsIndexSharedProps & { scrollRef: RefObject<ScrollView | null> }) {
  const { t } = useTranslation('settings');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.space56 },
        ]}
      >
        <SettingsSection title={t('streamExperience')}>
          <SettingsLinkRow
            title={t('chat')}
            subtitle={t('chatDescription')}
            icon={{
              icon: 'bubble.left.and.bubble.right',
              color: theme.color.plum[scheme],
            }}
            onPress={() => router.push('/tabs/settings/chat-preferences')}
          />
          <SettingsLinkRow
            title={t('blockedTerms')}
            subtitle={t('blockedTermsDescription')}
            icon={{
              icon: 'text.badge.xmark',
              color: theme.color.danger[scheme],
            }}
            onPress={() => router.push('/tabs/settings/blocked-terms')}
          />
          <SettingsLinkRow
            title={t('emotesAndBadges')}
            subtitle={t('emotesAndBadgesDescription')}
            icon={{ icon: 'face.smiling', color: theme.color.amber[scheme] }}
            onPress={() => router.push('/tabs/settings/emotes-and-badges')}
          />
          <SettingsLinkRow
            title={t('savedPhrases')}
            subtitle={t('savedPhrasesDescription')}
            icon={{ icon: 'text.bubble', color: theme.color.blue[scheme] }}
            onPress={() => router.push('/tabs/settings/saved-phrases')}
          />
          <SettingsLinkRow
            title={t('myClips')}
            subtitle={t('myClipsDescription')}
            icon={{ icon: 'scissors', color: theme.color.teal[scheme] }}
            onPress={() => router.push('/tabs/settings/my-clips')}
          />
          <SettingsLinkRow
            title={t('cache')}
            subtitle={t('cacheDescription')}
            icon={{
              icon: 'externaldrive',
              color: theme.color.accent[scheme],
            }}
            onPress={() => router.push('/tabs/settings/cache')}
          />
          <SettingsLinkRow
            title={t('appearance')}
            subtitle={t('appearanceDescription')}
            icon={{ icon: 'paintpalette', color: theme.color.amber[scheme] }}
            onPress={() => router.push('/tabs/settings/appearance')}
          />
        </SettingsSection>

        <SettingsSection title={t('account')}>
          <SettingsLinkRow
            title={isLoggedIn ? t('profile') : t('signIn')}
            subtitle={
              isLoggedIn ? t('profileDescription') : t('signInDescription')
            }
            icon={{ icon: 'person.circle', color: theme.color.teal[scheme] }}
            onPress={() => {
              if (isLoggedIn) {
                router.push('/tabs/settings/profile');
                return;
              }

              router.push('/auth-sheet');
            }}
          />
        </SettingsSection>

        <SettingsSection title={t('supportAndFeedback')}>
          <SettingsLinkRow
            title={t('aboutFoam')}
            subtitle={t('aboutFoamDescription')}
            icon={{ icon: 'info.circle', color: theme.color.blue[scheme] }}
            onPress={() => router.push('/tabs/settings/about')}
          />
          <SettingsLinkRow
            title={t('faq')}
            subtitle={t('faqDescription')}
            icon={{
              icon: 'questionmark.circle',
              color: theme.color.accent[scheme],
            }}
            onPress={() =>
              openLinkInBrowser('https://foam-app.com/faq', scheme)
            }
          />
          <SettingsLinkRow
            title={t('sendFeedback')}
            subtitle={t('sendFeedbackDescription')}
            icon={{ icon: 'paperplane', color: theme.color.teal[scheme] }}
            onPress={onSendFeedback}
          />
          <SettingsLinkRow
            title={t('status')}
            subtitle={t('statusDescription')}
            icon={{
              icon: 'checkmark.shield',
              color: theme.color.orange[scheme],
            }}
            onPress={() => openLinkInBrowser(statusPageUrl, scheme)}
          />
          <SettingsLinkRow
            title={t('website')}
            subtitle={t('websiteDescription')}
            icon={{ icon: 'globe', color: theme.color.violet[scheme] }}
            onPress={() => openLinkInBrowser(websiteUrl, scheme)}
          />
          <SettingsLinkRow
            title={t('ossLicenses')}
            subtitle={t('ossLicensesDescription')}
            icon={{ icon: 'doc.text', color: theme.color.violet[scheme] }}
            onPress={() => openLicenseList(t('ossLicenses'))}
          />
        </SettingsSection>

        <SettingsSection title={t('appUpdates')}>
          {canSeeUpdateAppButton ? (
            <SettingsLinkRow
              title={t('updateApp')}
              subtitle={t('updateAppDescription')}
              icon={{ icon: 'arrow.down.app', color: theme.color.teal[scheme] }}
              onPress={openStore}
            />
          ) : null}
          <SettingsLinkRow
            title={t('updateBundle')}
            subtitle={t('updateBundleDescription')}
            icon={{
              icon: 'arrow.triangle.2.circlepath',
              color: theme.color.blue[scheme],
            }}
            onPress={updateBundle}
          />
        </SettingsSection>

        <SettingsSection
          title={shouldShowDevTools ? t('developer') : t('more')}
        >
          {shouldShowDevTools ? (
            <SettingsLinkRow
              title={t('devTools')}
              subtitle={t('devToolsDescription')}
              icon={{ icon: 'hammer', color: theme.color.orange[scheme] }}
              onPress={() => router.push('/tabs/settings/dev-tools')}
            />
          ) : null}
          <SettingsLinkRow
            title={t('other')}
            subtitle={t('otherDescription')}
            icon={{
              icon: 'ellipsis.circle',
              color: theme.color.textSecondary[scheme],
            }}
            onPress={() => router.push('/tabs/settings/other')}
          />
        </SettingsSection>

        <View style={styles.buildWrap}>
          <BuildStatus />
          <Text type='xs' color='gray.textLow' style={styles.buildNote}>
            {t('buildNote')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  buildNote: {
    marginTop: theme.space12,
    paddingHorizontal: theme.space20,
    textAlign: 'center',
  },
  buildWrap: {
    alignItems: 'center',
    marginTop: theme.space12,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
});
