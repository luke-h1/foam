// "shape" here is @expo/ui API naming (clipShape, contentShape), not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Form,
  Host,
  HStack,
  Image as NativeImage,
  RNHostView,
  Section,
  Spacer,
  Text as NativeText,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  font,
  foregroundStyle,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';

import { Avatar } from '@app/components/avatar/avatar';
import { theme } from '@app/styles/themes';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { getBuildInfoLabel } from '@app/utils/version/build-info-label';

import {
  APP_MENU_ROWS,
  CHAT_MENU_ROWS,
  HELP_MENU_ROWS,
  type SettingsMenuRow,
} from '../util/settings-menu';
import { FormNavigationRow } from './form-navigation-row';

function MenuRows({ rows }: { rows: SettingsMenuRow[] }) {
  return rows.map(row =>
    row.pushes ? (
      <FormNavigationRow
        key={row.label}
        label={row.label}
        systemImage={row.icon}
        onPress={row.onPress}
      />
    ) : (
      <Button
        key={row.label}
        label={row.label}
        systemImage={row.icon}
        onPress={row.onPress}
      />
    ),
  );
}

interface SettingsIndexIOSFormProps {
  bundleButtonEnabled: boolean;
  canSeeUpdateAppButton: boolean;
  user: UserInfoResponse | undefined;
  openStore: () => void;
  shouldShowDevTools: boolean;
  updateBundle: () => void;
}

/**
 * The first row of the form. It shows the signed-in user, or a sign-in row
 * when signed out. Only the avatar is a hosted React Native view. The press
 * and the text stay native, so the row behaves like the other rows.
 */
function AccountRow({ user }: { user: UserInfoResponse }) {
  return (
    <Button
      onPress={() => router.push('/tabs/settings/profile')}
      modifiers={[buttonStyle('plain')]}
    >
      <HStack spacing={14} modifiers={[contentShape(shapes.rectangle())]}>
        <RNHostView matchContents>
          <View pointerEvents='none'>
            <Avatar
              uri={user.profile_image_url || undefined}
              name={user.display_name}
              size={52}
            />
          </View>
        </RNHostView>
        <VStack alignment='leading' spacing={2}>
          <NativeText
            modifiers={[
              font({ size: 20, weight: 'semibold' }),
              foregroundStyle(theme.color.text.dark),
            ]}
          >
            {user.display_name}
          </NativeText>
          <NativeText
            modifiers={[
              font({ size: 15 }),
              foregroundStyle(theme.color.textSecondary.dark),
            ]}
          >
            Profile and Twitch account
          </NativeText>
        </VStack>
        <Spacer />
        <NativeImage
          systemName='chevron.right'
          size={13}
          color={theme.color.textSecondary.dark}
        />
      </HStack>
    </Button>
  );
}

export function SettingsIndexIOSForm({
  bundleButtonEnabled,
  canSeeUpdateAppButton,
  user,
  openStore,
  shouldShowDevTools,
  updateBundle,
}: SettingsIndexIOSFormProps) {
  return (
    <Host style={styles.iosHost}>
      <Form>
        {user ? (
          <Section>
            <AccountRow user={user} />
            <FormNavigationRow
              label='My clips'
              systemImage='scissors'
              onPress={() => router.push('/tabs/settings/my-clips')}
            />
          </Section>
        ) : (
          <Section
            footer={
              <NativeText>
                See the channels you follow and chat as yourself.
              </NativeText>
            }
          >
            <Button
              label='Sign in with Twitch'
              systemImage='person.crop.circle'
              onPress={() => router.push('/auth-sheet')}
              modifiers={[foregroundStyle(theme.color.accent.dark)]}
            />
          </Section>
        )}

        <Section title='Chat'>
          <MenuRows rows={CHAT_MENU_ROWS} />
        </Section>

        <Section title='App'>
          <MenuRows rows={APP_MENU_ROWS} />
        </Section>

        {canSeeUpdateAppButton || bundleButtonEnabled ? (
          <Section title='Updates'>
            {canSeeUpdateAppButton ? (
              <Button
                label='Update app'
                systemImage='arrow.down.app'
                onPress={openStore}
              />
            ) : null}
            {bundleButtonEnabled ? (
              <Button
                label='Update bundle'
                systemImage='arrow.triangle.2.circlepath'
                onPress={updateBundle}
              />
            ) : null}
          </Section>
        ) : null}

        <Section
          title='Help'
          footer={shouldShowDevTools ? null : <BuildFooter />}
        >
          <MenuRows rows={HELP_MENU_ROWS} />
        </Section>

        {shouldShowDevTools ? (
          <Section title='Developer' footer={<BuildFooter />}>
            <FormNavigationRow
              label='Dev tools'
              systemImage='hammer'
              onPress={() => router.push('/tabs/settings/dev-tools')}
            />
          </Section>
        ) : null}
      </Form>
    </Host>
  );
}

function BuildFooter() {
  return <NativeText>{getBuildInfoLabel()}</NativeText>;
}

const styles = StyleSheet.create({
  iosHost: {
    flex: 1,
  },
});
