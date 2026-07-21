import { StyleSheet, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Form, Host, Section, Text as UIText } from '@expo/ui/swift-ui';
import { router } from 'expo-router';

import { openLicenseList } from '@app/lib/legal';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { getBuildInfoLabel } from '@app/utils/version/buildInfoLabel';

export interface SettingsIndexSharedProps {
  isLoggedIn: boolean;
  shouldShowDevTools: boolean;
  statusPageUrl: string;
  websiteUrl: string;
  bundleButtonEnabled: boolean;
  canSeeUpdateAppButton: boolean;
  openStore: () => void;
  updateBundle: () => void;
  onSendFeedback: () => void;
}

export function SettingsIndexIosForm({
  isLoggedIn,
  shouldShowDevTools,
  statusPageUrl,
  websiteUrl,
  bundleButtonEnabled,
  canSeeUpdateAppButton,
  openStore,
  updateBundle,
  onSendFeedback,
}: SettingsIndexSharedProps) {
  const { t } = useTranslation('settings');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

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
            label={isLoggedIn ? t('profile') : t('signIn')}
            systemImage='person.circle'
            onPress={() => {
              if (isLoggedIn) {
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
            onPress={onSendFeedback}
          />
          <Button
            label={t('status')}
            systemImage='checkmark.shield'
            onPress={() => openLinkInBrowser(statusPageUrl, scheme)}
          />
          <Button
            label={t('website')}
            systemImage='globe'
            onPress={() => openLinkInBrowser(websiteUrl, scheme)}
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

const styles = StyleSheet.create({
  iosHost: {
    flex: 1,
  },
});
