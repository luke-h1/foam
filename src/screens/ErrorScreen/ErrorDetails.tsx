import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { sentryService } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { type ErrorInfo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.space16,
    marginBottom: theme.space20,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.space44,
    paddingHorizontal: theme.space36,
    paddingTop: theme.space56,
  },
  description: {
    lineHeight: theme.fontSize16 * 1.5,
    paddingHorizontal: theme.space16,
  },
  errorBackTrace: {
    fontFamily: 'monospace',
    lineHeight: theme.fontSize12 * 1.5,
  },
  errorCard: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorGreyAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.space16,
    borderWidth: 1,
    marginBottom: theme.space28,
    overflow: 'hidden',
  },
  errorContentContainer: {
    padding: theme.space20,
  },
  errorMessage: {
    lineHeight: theme.fontSize14 * 1.4,
    marginBottom: theme.space16,
  },
  errorScrollView: {
    maxHeight: 300,
  },
  heading: {
    marginBottom: theme.space16,
  },
  iconContainer: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorRed,
    borderCurve: 'continuous',
    borderRadius: theme.space36,
    borderWidth: 2,
    marginBottom: theme.space28,
    padding: theme.space20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colorBlue,
    borderCurve: 'continuous',
    borderRadius: theme.space16,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space16,
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: theme.colorRed,
    borderCurve: 'continuous',
    borderRadius: theme.space16,
    justifyContent: 'center',
    marginTop: theme.space16,
    paddingHorizontal: theme.space36,
    paddingVertical: theme.space16,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colorGrey,
    borderCurve: 'continuous',
    borderRadius: theme.space16,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space16,
  },
  toggleButton: {
    marginBottom: theme.space20,
    paddingVertical: theme.space12,
  },
  toggleText: {
    textDecorationLine: 'underline',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: theme.space44,
  },
});
