import { useRef } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';

import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/settings-section/SettingsSection';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { openLicenseList } from '@app/lib/legal';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

import { AboutIdentity } from './components/AboutIdentity';
import { useAboutDetails } from './hooks/use-about-details';

export function AboutScreen() {
  const scrollRef = useRef<ScrollViewInstance>(null);

  const { websiteUrl, statusPageUrl, version, build, otaLabel } =
    useAboutDetails();

  useScrollToTop(scrollRef);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.main}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior='automatic'
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection>
          <AboutIdentity />
        </SettingsSection>

        <SettingsSection title='Resources'>
          <SettingsLinkRow
            title='Website'
            icon={{ icon: 'globe' }}
            onPress={() => openLinkInBrowser(websiteUrl)}
          />
          <SettingsLinkRow
            title='Status'
            icon={{ icon: 'checkmark.shield' }}
            onPress={() => openLinkInBrowser(statusPageUrl)}
          />
          <SettingsLinkRow
            title='Licenses'
            icon={{ icon: 'doc.text' }}
            onPress={() => openLicenseList('Licenses')}
          />
        </SettingsSection>

        <SettingsSection title='Build'>
          <SettingsLinkRow title='Version' value={version} />
          <SettingsLinkRow title='Build' value={build} />
          <SettingsLinkRow title='OTA' value={otaLabel} />
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
  main: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
});
