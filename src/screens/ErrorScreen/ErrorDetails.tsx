import Button from '@app/components/ui/Button';
import Screen from '@app/components/ui/Screen';
import { Text } from '@app/components/ui/Text';
import { colors, spacing } from '@app/styles';
import { openLinkInBrowser } from '@app/utils/openLinkInBrowser';
import React, { ErrorInfo } from 'react';
import { ScrollView, TextStyle, View, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface ErrorDetailsProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

export default function ErrorDetails(props: ErrorDetailsProps) {
  const { error, errorInfo, onReset } = props;
  const errorTitle = `${error}`.trim();

  // issue body = first 10 lines of the error stack

  const stackTrace = errorInfo?.componentStack
    ?.split('\n')
    .slice(0, 10)
    .join('\n');

  const githubURL = encodeURI(
    `https://github.com/luke-h1/foam/issues/new?title=(CRASH) ${errorTitle}&body=What were you doing when the app crashed?\n\n\nTruncated Stacktrace:\n\`\`\`${stackTrace}\`\`\``,
  );

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={['top', 'bottom']}
      contentContainerStyle={$contentContainer}
    >
      <View style={$topSection}>
        <MaterialIcons name="error" />
        <Text
          style={$heading}
          preset="subheading"
          text="Something went wrong"
        />
        <Text text="Try resetting or restarting the app & see if that helps. If not, feel free to file an issue on GitHub and we'll take a look. Bonus points: Find the bug and open a PR!" />
      </View>
      <Button
        preset="default"
        style={$githubButton}
        shadowStyle={$button}
        text="Go To GitHub"
        onPress={() => openLinkInBrowser(githubURL)}
      />
      <ScrollView
        style={$errorSection}
        contentContainerStyle={$errorSectionContentContainer}
      >
        <Text weight="bold" text={`${error}`.trim()} />
        <Text
          selectable
          style={$errorBacktrace}
          text={`${errorInfo?.componentStack}`.trim()}
        />
      </ScrollView>
      <Button
        style={$resetButton}
        shadowStyle={$button}
        onPress={onReset}
        text="Reset"
      />
    </Screen>
  );
}

const $contentContainer: ViewStyle = {
  alignItems: 'center',
  paddingHorizontal: spacing.large,
  paddingVertical: spacing.medium,
  flex: 1,
};

const $topSection: ViewStyle = {
  alignItems: 'center',
  marginBottom: spacing.large,
};

const $heading: TextStyle = {
  marginBottom: spacing.medium,
};

const $errorSection: ViewStyle = {
  flex: 2,
  backgroundColor: colors.separator,
  marginBottom: spacing.medium,
  marginTop: spacing.large,
  borderRadius: 6,
};

const $errorSectionContentContainer: ViewStyle = {
  padding: spacing.medium,
};

const $errorBacktrace: TextStyle = {
  marginTop: spacing.medium,
  color: colors.textDim,
};

const $button: ViewStyle = {
  backgroundColor: colors.error,
};

const $resetButton: ViewStyle = {
  ...$button,
  paddingHorizontal: spacing.huge,
};

const $githubButton: ViewStyle = {
  ...$button,
  paddingHorizontal: spacing.huge,
};
