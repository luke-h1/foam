import { useRef } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Form, Host, Section, Text as UIText } from '@expo/ui/swift-ui';
import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { useAppUpdate } from '@app/hooks/useAppUpdate';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { openLicenseList } from '@app/lib/legal';
import { theme } from '@app/styles/themes';
import { isUpdateAppButtonAllowed } from '@app/utils/appUpdate/isUpdateAppButtonAllowed';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import {
  isAdminLogin,
  isDevToolsEnabled,
} from '@app/utils/devTools/devToolsGate';
import { getBuildInfoLabel } from '@app/utils/version/buildInfoLabel';

import { BuildStatus } from './components/BuildStatus';

function handleSendFeedback() {
  router.push('/feedback');
}

const variant = process.env.EXPO_PUBLIC_APP_VARIANT;

export function SettingsIndexScreen() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const { user } = useAuthContext();
  const { config } = useRemoteConfig();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { openStore, updateBundle } = useAppUpdate();
  const shouldShowDevTools =
    isDevToolsEnabled || isAdminLogin(user?.login, config.admins.value);
  const { t } = useTranslation('settings');

  useScrollToTop(scrollRef);

  const {
    statusPageUrl,
    websiteUrl,
    bundleButtonEnabled: configBundleButtonEnabled,
  } = config;

  const bundleButtonEnabled = configBundleButtonEnabled.value.ios[variant];
  const canSeeUpdateAppButton = isUpdateAppButtonAllowed(
    user?.login,
    config.updateAppButtonAllowedUsers.value,
  );

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section title={t('streamExperience')}>
            <Button
              label={t('chat')}
              systemImage='bubble.left.and.bubble.right'
              onPress={() => router.push('/tabs/settings/chat-preferences')}
            />
            <Button
              label={t('blockedTerms')}
              systemImage='text.badge.xmark'
              onPress={() => router.push('/tabs/settings/blocked-terms')}
            />
            <Button
              label={t('emotesAndBadges')}
              systemImage='face.smiling'
              onPress={() => router.push('/tabs/settings/emotes-and-badges')}
            />
            <Button
              label={t('savedPhrases')}
              systemImage='text.bubble'
              onPress={() => router.push('/tabs/settings/saved-phrases')}
            />
            <Button
              label={t('cache')}
              systemImage='externaldrive'
              onPress={() => router.push('/tabs/settings/cache')}
            />
            <Button
              label={t('appearance')}
              systemImage='paintpalette'
              onPress={() => router.push('/tabs/settings/appearance')}
            />
          </Section>

          <Section title={t('account')}>
            <Button
              label={user ? t('profile') : t('signIn')}
              systemImage='person.circle'
              onPress={() => {
                if (user) {
                  router.push('/tabs/settings/profile');
                  return;
                }

                router.push('/auth-sheet');
              }}
            />
          </Section>

          <Section title={t('supportAndFeedback')}>
            <Button
              label={t('aboutFoam')}
              systemImage='info.circle'
              onPress={() => router.push('/tabs/settings/about')}
            />
            <Button
              label={t('faq')}
              systemImage='questionmark.circle'
              onPress={() =>
                openLinkInBrowser('https://foam-app.com/faq', scheme)
              }
            />
            <Button
              label={t('sendFeedback')}
              systemImage='paperplane'
              onPress={handleSendFeedback}
            />
            <Button
              label={t('status')}
              systemImage='checkmark.shield'
              onPress={() => openLinkInBrowser(statusPageUrl.value, scheme)}
            />
            <Button
              label={t('website')}
              systemImage='globe'
              onPress={() => openLinkInBrowser(websiteUrl.value, scheme)}
            />
            <Button
              label={t('ossLicenses')}
              systemImage='doc.text'
              onPress={() => openLicenseList(t('ossLicenses'))}
            />
          </Section>

          {canSeeUpdateAppButton || bundleButtonEnabled ? (
            <Section title={t('appUpdates')}>
              {canSeeUpdateAppButton ? (
                <Button
                  label={t('updateApp')}
                  systemImage='arrow.down.app'
                  onPress={openStore}
                />
              ) : null}
              {bundleButtonEnabled ? (
                <Button
                  label={t('updateBundle')}
                  systemImage='arrow.triangle.2.circlepath'
                  onPress={updateBundle}
                />
              ) : null}
            </Section>
          ) : null}

          <Section
            title={shouldShowDevTools ? t('developer') : t('more')}
            footer={<UIText>{getBuildInfoLabel()}</UIText>}
          >
            {shouldShowDevTools ? (
              <Button
                label={t('devTools')}
                systemImage='hammer'
                onPress={() => router.push('/tabs/settings/dev-tools')}
              />
            ) : null}
            <Button
              label={t('other')}
              systemImage='ellipsis.circle'
              onPress={() => router.push('/tabs/settings/other')}
            />
          </Section>
        </Form>
      </Host>
    );
  }

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
            title={user ? t('profile') : t('signIn')}
            subtitle={user ? t('profileDescription') : t('signInDescription')}
            icon={{ icon: 'person.circle', color: theme.color.teal[scheme] }}
            onPress={() => {
              if (user) {
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
            onPress={handleSendFeedback}
          />
          <SettingsLinkRow
            title={t('status')}
            subtitle={t('statusDescription')}
            icon={{
              icon: 'checkmark.shield',
              color: theme.color.orange[scheme],
            }}
            onPress={() => openLinkInBrowser(statusPageUrl.value, scheme)}
          />
          <SettingsLinkRow
            title={t('website')}
            subtitle={t('websiteDescription')}
            icon={{ icon: 'globe', color: theme.color.violet[scheme] }}
            onPress={() => openLinkInBrowser(websiteUrl.value, scheme)}
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
  iosHost: {
    flex: 1,
  },
});
