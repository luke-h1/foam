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

import { Avatar } from '@app/components/avatar/Avatar';
import { theme } from '@app/styles/themes';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { getBuildInfoLabel } from '@app/utils/version/buildInfoLabel';

import {
  PROFILE_ROW,
  type SettingsMenuRow,
  type SettingsMenuSection,
  SIGN_IN_FOOTER,
  SIGN_IN_ROW,
  SIGNED_IN_MENU_ROWS,
} from '../util/settingsMenu';
import { FormNavigationRow } from './FormNavigationRow';

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
  user: UserInfoResponse | undefined;
  sections: SettingsMenuSection[];
}

/**
 * The first row of the form for a signed-in user. Only the avatar is a hosted
 * React Native view. The press and the text stay native, so the row behaves
 * like the other rows.
 */
function AccountRow({ user }: { user: UserInfoResponse }) {
  return (
    <Button onPress={PROFILE_ROW.onPress} modifiers={[buttonStyle('plain')]}>
      <HStack spacing={14} modifiers={[contentShape(shapes.rectangle())]}>
        <RNHostView matchContents>
          <View pointerEvents='none' style={styles.avatarHost}>
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
            {PROFILE_ROW.subtitle}
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
  user,
  sections,
}: SettingsIndexIOSFormProps) {
  return (
    <Host style={styles.iosHost}>
      <Form>
        {user ? (
          <Section>
            <AccountRow user={user} />
            <MenuRows rows={SIGNED_IN_MENU_ROWS} />
          </Section>
        ) : (
          <Section footer={<NativeText>{SIGN_IN_FOOTER}</NativeText>}>
            <Button
              label={SIGN_IN_ROW.label}
              systemImage={SIGN_IN_ROW.icon}
              onPress={SIGN_IN_ROW.onPress}
              modifiers={[foregroundStyle(theme.color.accent.dark)]}
            />
          </Section>
        )}

        {sections.map((section, index) => (
          <Section
            key={section.title}
            title={section.title}
            footer={index === sections.length - 1 ? <BuildFooter /> : null}
          >
            <MenuRows rows={section.rows} />
          </Section>
        ))}
      </Form>
    </Host>
  );
}

function BuildFooter() {
  return <NativeText>{getBuildInfoLabel()}</NativeText>;
}

const styles = StyleSheet.create({
  /**
   * The hosted view needs a fixed size. Without one, Yoga stretches it to
   * the host and `matchContents` turns the account row into a screen-tall
   * card.
   */
  avatarHost: {
    height: 52,
    width: 52,
  },
  iosHost: {
    flex: 1,
  },
});
