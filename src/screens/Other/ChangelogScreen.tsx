import { useRef } from 'react';
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';

// todo - in the future, read from github md
const mockChangelog = `
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New feature to support dark mode.
- Added user profile page.

### Changed
- Updated the UI for the login screen.
- Improved performance of the data fetching logic.

### Fixed
- Fixed a bug where the app would crash on startup.
- Resolved an issue with the navigation bar not displaying correctly.

## [1.0.1] - 2023-10-01

### Added
- Initial release of the app.
- Basic user authentication.
- Home screen with featured content.

### Fixed
- Minor bug fixes and improvements.

## [1.0.0] - 2023-09-15

### Added
- Initial beta release.
- Core functionality including user login, content browsing, and settings.
`;

export function ChangelogScreen() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

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
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.color.backgroundAltAlpha[scheme],
              borderColor: theme.color.border[scheme],
            },
          ]}
        >
          <Text variant='mono' type='xs' style={styles.changelogText}>
            {mockChangelog}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space20,
  },
  changelogText: {
    lineHeight: 20,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: theme.space44,
    paddingHorizontal: theme.space20,
  },
});
