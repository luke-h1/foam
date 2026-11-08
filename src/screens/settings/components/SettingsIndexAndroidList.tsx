import { useRef } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/settings-section/SettingsSection';
import { Text } from '@app/components/ui/text/Text';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { theme } from '@app/styles/themes';
import type { UserInfoResponse } from '@app/types/twitch/user';

import {
  PROFILE_ROW,
  type SettingsMenuSection,
  SIGN_IN_FOOTER,
  SIGN_IN_ROW,
  SIGNED_IN_MENU_ROWS,
} from '../util/settingsMenu';
import { toLinkRow } from '../util/toLinkRow';
import { BuildStatus } from './BuildStatus';

interface SettingsIndexAndroidListProps {
  user: UserInfoResponse | undefined;
  sections: SettingsMenuSection[];
}

export function SettingsIndexAndroidList({
  user,
  sections,
}: SettingsIndexAndroidListProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewInstance>(null);

  useScrollToTop(scrollRef);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.space56 },
        ]}
      >
        {user ? (
          <SettingsSection>
            <SettingsLinkRow
              title={user.display_name}
              subtitle={PROFILE_ROW.subtitle}
              icon={PROFILE_ROW}
              onPress={PROFILE_ROW.onPress}
            />
            {SIGNED_IN_MENU_ROWS.map(toLinkRow)}
          </SettingsSection>
        ) : (
          <SettingsSection
            footer={
              <Text type='footnote' color='gray.textLow'>
                {SIGN_IN_FOOTER}
              </Text>
            }
          >
            {toLinkRow(SIGN_IN_ROW)}
          </SettingsSection>
        )}

        {/* oxlint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- at most five menu sections */}
        {sections.map(section => (
          <SettingsSection key={section.title} title={section.title}>
            {section.rows.map(toLinkRow)}
          </SettingsSection>
        ))}

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
