import { StyleSheet } from 'react-native';

import { Button, Form, Host, Section, Text as UIText } from '@expo/ui/swift-ui';
import { router } from 'expo-router';

import { openLicenseList } from '@app/lib/legal';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { getBuildInfoLabel } from '@app/utils/version/buildInfoLabel';

import { FormNavigationRow } from './FormNavigationRow';

function handleSendFeedback() {
  router.push('/feedback');
}

export function SettingsIndexIOSForm({
  bundleButtonEnabled,
  canSeeUpdateAppButton,
  hasUser,
  openStore,
  shouldShowDevTools,
  statusPageUrl,
  updateBundle,
  websiteUrl,
}: {
  bundleButtonEnabled: boolean;
  canSeeUpdateAppButton: boolean;
  hasUser: boolean;
  openStore: () => void;
  shouldShowDevTools: boolean;
  statusPageUrl: string;
  updateBundle: () => void;
  websiteUrl: string;
}) {
  return (
    <Host style={styles.iosHost}>
      <Form>
        <Section title='Stream Experience'>
          <FormNavigationRow
            label='Chat'
            systemImage='bubble.left.and.bubble.right'
            onPress={() => router.push('/tabs/settings/chat-preferences')}
          />
          <FormNavigationRow
            label='Blocked Terms'
            systemImage='text.badge.xmark'
            onPress={() => router.push('/tabs/settings/blocked-terms')}
          />
          <FormNavigationRow
            label='Emotes & Badges'
            systemImage='face.smiling'
            onPress={() => router.push('/tabs/settings/emotes-and-badges')}
          />
          <FormNavigationRow
            label='Saved Phrases'
            systemImage='text.bubble'
            onPress={() => router.push('/tabs/settings/saved-phrases')}
          />
          <FormNavigationRow
            label='My Clips'
            systemImage='scissors'
            onPress={() => router.push('/tabs/settings/my-clips')}
          />
          <FormNavigationRow
            label='Cache'
            systemImage='externaldrive'
            onPress={() => router.push('/tabs/settings/cache')}
          />
          <FormNavigationRow
            label='Appearance'
            systemImage='paintpalette'
            onPress={() => router.push('/tabs/settings/appearance')}
          />
        </Section>

        <Section title='Account'>
          <FormNavigationRow
            label={hasUser ? 'Profile' : 'Sign In'}
            systemImage='person.circle'
            onPress={() => {
              if (hasUser) {
                router.push('/tabs/settings/profile');
                return;
              }

              router.push('/auth-sheet');
            }}
          />
        </Section>

        <Section title='Support & Feedback'>
          <FormNavigationRow
            label='About Foam'
            systemImage='info.circle'
            onPress={() => router.push('/tabs/settings/about')}
          />
          <Button
            label='FAQ'
            systemImage='questionmark.circle'
            onPress={() => openLinkInBrowser('https://foam-app.com/faq')}
          />
          <Button
            label='Send Feedback'
            systemImage='paperplane'
            onPress={handleSendFeedback}
          />
          <Button
            label='Status'
            systemImage='checkmark.shield'
            onPress={() => openLinkInBrowser(statusPageUrl)}
          />
          <Button
            label='Website'
            systemImage='globe'
            onPress={() => openLinkInBrowser(websiteUrl)}
          />
          <Button
            label='OSS Licenses'
            systemImage='doc.text'
            onPress={() => openLicenseList('OSS Licenses')}
          />
        </Section>

        {canSeeUpdateAppButton || bundleButtonEnabled ? (
          <Section title='App Updates'>
            {canSeeUpdateAppButton ? (
              <Button
                label='Update App'
                systemImage='arrow.down.app'
                onPress={openStore}
              />
            ) : null}
            {bundleButtonEnabled ? (
              <Button
                label='Update Bundle'
                systemImage='arrow.triangle.2.circlepath'
                onPress={updateBundle}
              />
            ) : null}
          </Section>
        ) : null}

        <Section
          title={shouldShowDevTools ? 'Developer' : 'More'}
          footer={<UIText>{getBuildInfoLabel()}</UIText>}
        >
          {shouldShowDevTools ? (
            <FormNavigationRow
              label='Dev Tools'
              systemImage='hammer'
              onPress={() => router.push('/tabs/settings/dev-tools')}
            />
          ) : null}
          <FormNavigationRow
            label='Other'
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
