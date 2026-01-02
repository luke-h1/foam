import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { Text } from '@app/components/Text';
import { sentryService } from '@app/services/sentry-service';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
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

  const handleShowFeedback = () => {
    sentryService.showFeedbackWidget();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Icon icon="alert-circle" size={48} />
        </View>
        <Text type="xl" weight="semibold" style={styles.heading} align="center">
          Something went wrong
        </Text>
        <Text type="md" color="gray" align="center" style={styles.description}>
          Try resetting or restarting the app & see if that helps. If not, feel
          free to click the 'send feedback' button to report the issue to the
          developers.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          style={styles.primaryButton}
          onPress={() => openLinkInBrowser(githubURL)}
        >
          <Text
            type="md"
            weight="semibold"
            color="blue"
            contrast
            align="center"
          >
            GitHub
          </Text>
        </Button>
        <Button style={styles.secondaryButton} onPress={handleShowFeedback}>
          <Text
            type="md"
            weight="semibold"
            color="gray"
            contrast
            align="center"
          >
            Send Feedback
          </Text>
        </Button>
      </View>

      <Button
        style={styles.toggleButton}
        onPress={() => setShowStackTrace(!showStackTrace)}
      >
        <Text type="sm" color="blue" align="center" style={styles.toggleText}>
          {showStackTrace ? 'Hide Stack Trace' : 'Show Stack Trace'}
        </Text>
      </Button>

      {showStackTrace && (
        <View style={styles.errorCard}>
          <ScrollView
            style={styles.errorScrollView}
            contentContainerStyle={styles.errorContentContainer}
            showsVerticalScrollIndicator
          >
            {error?.message && (
              <Text
                type="sm"
                weight="semibold"
                color="red"
                style={styles.errorMessage}
              >
                {error.message.trim()}
              </Text>
            )}
            {errorInfo?.componentStack && (
              <Text
                selectable
                type="xs"
                color="gray"
                style={styles.errorBackTrace}
              >
                {errorInfo.componentStack.trim()}
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      <Button style={styles.resetButton} onPress={onReset}>
        <Text type="md" weight="semibold" color="red" contrast align="center">
          Reset App
        </Text>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing['3xl'],
  },
  topSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.gray.bgAlt,
    borderRadius: theme.spacing['2xl'],
    borderWidth: 2,
    borderColor: theme.colors.red.accent,
  },
  heading: {
    marginBottom: theme.spacing.md,
  },
  description: {
    lineHeight: theme.font.fontSize.md * 1.5,
    paddingHorizontal: theme.spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: theme.colors.blue.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.gray.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  toggleText: {
    textDecorationLine: 'underline',
  },
  errorCard: {
    backgroundColor: theme.colors.gray.bgAlt,
    borderRadius: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.gray.accentAlpha,
    overflow: 'hidden',
  },
  errorScrollView: {
    maxHeight: 300,
  },
  errorContentContainer: {
    padding: theme.spacing.lg,
  },
  errorMessage: {
    marginBottom: theme.spacing.md,
    lineHeight: theme.font.fontSize.sm * 1.4,
  },
  errorBackTrace: {
    fontFamily: 'monospace',
    lineHeight: theme.font.fontSize.xs * 1.5,
  },
  resetButton: {
    backgroundColor: theme.colors.red.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
}));
