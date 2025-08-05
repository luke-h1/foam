import { Button, Icon, Text } from '@app/components';
import { openLinkInBrowser } from '@app/utils';
import { type ErrorInfo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface ErrorDetailsProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

export function ErrorDetails(props: ErrorDetailsProps) {
  const { error, errorInfo, onReset } = props;
  const [showStackTrace, setShowStackTrace] = useState(false);

  const errorTitle = `${error}`.trim();

  const stackTrace = errorInfo?.componentStack
    ?.split('\n')
    .slice(0, 10)
    .join('\n');

  const githubURL = encodeURI(
    `https://github.com/luke-h1/foam/issues/new?title=(CRASH) ${errorTitle}&body=What were you doing when the app crashed?\n\n\nTruncated Stacktrace:\n\`\`\`${stackTrace}\`\`\``,
  );

  return (
    <>
      <View style={styles.topSection}>
        <Icon icon="alert-circle" size={30} />
        <Text style={styles.heading}>Something went wrong</Text>
        <Text>
          Try resetting or restarting the app & see if that helps. If not, feel
          free to file an issue on GitHub and we'll take a look
        </Text>
      </View>
      <Button
        style={styles.resetButton}
        onPress={() => openLinkInBrowser(githubURL)}
      >
        GitHub
      </Button>
      <Button onPress={() => setShowStackTrace(!showStackTrace)}>
        <Text style={styles.toggleStackTrace}>
          {showStackTrace ? 'Hide Stack Trace' : 'Show Stack Trace'}
        </Text>
      </Button>
      {showStackTrace && (
        <ScrollView
          style={styles.errorSection}
          contentContainerStyle={styles.errorSectionContentContainer}
        >
          <Text variant="caption2">{error?.message.trim()}</Text>
          <Text
            selectable
            style={styles.errorBackTrace}
            color="text"
            variant="footnote"
          >
            {errorInfo?.componentStack?.trim()}
          </Text>
        </ScrollView>
      )}
      <Button style={styles.resetButton} onPress={onReset}>
        Reset
      </Button>
    </>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  heading: {
    marginBottom: theme.spacing.md,
  },
  toggleStackTrace: {
    color: 'blue',
    marginVertical: theme.spacing.md,
  },
  errorSection: {
    flex: 2,
    backgroundColor: theme.colors.borderFaint,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderRadius: 6,
  },
  errorSectionContentContainer: {
    // padding: theme.spacing.md,
  },
  errorBackTrace: {
    marginTop: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.cherry,
  },
  resetButton: {
    backgroundColor: theme.colors.cherry,
    paddingHorizontal: theme.spacing.lg,
  },
}));
