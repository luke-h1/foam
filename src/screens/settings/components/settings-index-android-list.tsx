import { ScrollView, StyleSheet, View } from 'react-native';
import type { RefObject } from 'react';

import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/settings-section/settings-section';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import type { UserInfoResponse } from '@app/types/twitch/user';

import {
  APP_MENU_ROWS,
  CHAT_MENU_ROWS,
  HELP_MENU_ROWS,
  type SettingsMenuRow,
} from '../util/settings-menu';
import { BuildStatus } from './build-status';

/**
 * `SettingsSection` draws a separator between its direct children, so the
 * rows are mapped in place rather than wrapped in a component.
 */
function toLinkRow(row: SettingsMenuRow) {
  return (
    <SettingsLinkRow
      key={row.label}
      title={row.label}
      icon={{ icon: row.icon }}
      onPress={row.onPress}
    />
  );
}

interface SettingsIndexAndroidListProps {
  bottomInset: number;
  canSeeUpdateAppButton: boolean;
  user: UserInfoResponse | undefined;
  openStore: () => void;
  scrollRef: RefObject<ScrollView | null>;
  shouldShowDevTools: boolean;
  updateBundle: () => void;
}

/**
 * Same order as the iOS form: account, then chat, app and help. Rows have
 * no subtitle. The update bundle row always shows on Android.
 */
export function SettingsIndexAndroidList({
  bottomInset,
  canSeeUpdateAppButton,
  user,
  openStore,
  scrollRef,
  shouldShowDevTools,
  updateBundle,
}: SettingsIndexAndroidListProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset + theme.space56 },
        ]}
      >
        {user ? (
          <SettingsSection>
            <SettingsLinkRow
              title={user.display_name}
              subtitle='Profile and Twitch account'
              icon={{ icon: 'person.crop.circle' }}
              onPress={() => router.push('/tabs/settings/profile')}
            />
            <SettingsLinkRow
              title='My clips'
              icon={{ icon: 'scissors' }}
              onPress={() => router.push('/tabs/settings/my-clips')}
            />
          </SettingsSection>
        ) : (
          <SettingsSection
            footer={
              <Text type='footnote' color='gray.textLow'>
                See the channels you follow and chat as yourself.
              </Text>
            }
          >
            <SettingsLinkRow
              title='Sign in with Twitch'
              icon={{ icon: 'person.crop.circle' }}
              onPress={() => router.push('/auth-sheet')}
            />
          </SettingsSection>
        )}

        <SettingsSection title='Chat'>
          {CHAT_MENU_ROWS.map(toLinkRow)}
        </SettingsSection>

        <SettingsSection title='App'>
          {APP_MENU_ROWS.map(toLinkRow)}
        </SettingsSection>

        <SettingsSection title='Updates'>
          {canSeeUpdateAppButton ? (
            <SettingsLinkRow
              title='Update app'
              icon={{ icon: 'arrow.down.app' }}
              onPress={openStore}
            />
          ) : null}
          <SettingsLinkRow
            title='Update bundle'
            icon={{ icon: 'arrow.triangle.2.circlepath' }}
            onPress={updateBundle}
          />
        </SettingsSection>

        <SettingsSection title='Help'>
          {HELP_MENU_ROWS.map(toLinkRow)}
        </SettingsSection>

        {shouldShowDevTools ? (
          <SettingsSection title='Developer'>
            <SettingsLinkRow
              title='Dev tools'
              icon={{ icon: 'hammer' }}
              onPress={() => router.push('/tabs/settings/dev-tools')}
            />
          </SettingsSection>
        ) : null}

        <View style={styles.buildWrap}>
          <BuildStatus />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  buildWrap: {
    alignItems: 'center',
    marginTop: theme.space12,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.space16,
    paddingTop: theme.space16,
  },
});
