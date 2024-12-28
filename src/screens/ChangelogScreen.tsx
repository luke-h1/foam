import Screen from '@app/components/ui/Screen';
import { Text } from '@app/components/ui/Text';
import useHeader from '@app/hooks/useHeader';
import { useNavigation } from '@react-navigation/native';

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

export default function ChangelogScreen() {
  const { goBack } = useNavigation();
  useHeader({
    title: 'Changelog',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });

  return (
    <Screen preset="scroll">
      <Text>{mockChangelog}</Text>
    </Screen>
  );
}