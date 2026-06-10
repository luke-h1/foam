import type { ErrorInfo } from 'react';
import { Button } from '@app/components/Button/Button';
import { SymbolView } from 'expo-symbols';
import { Text } from '@app/components/ui/Text/Text';
import { queryClient } from '@app/lib/react-query/query-client';
import { showFeedbackWidget } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import {
  categorizeError,
  getFriendlyErrorMessage,
} from '@app/utils/errors/categorizeError';
import { useObservable, useSelector } from '@legendapp/state/react';
import { ScrollView, View, StyleSheet } from 'react-native';

export interface ErrorDetailsProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function handleShowFeedback() {
  showFeedbackWidget();
}

export function ErrorDetails(props: ErrorDetailsProps) {
  const { error, errorInfo, onReset } = props;
  const showStackTrace$ = useObservable(false);
  const showStackTrace = useSelector(showStackTrace$);

  const errorTitle = `${error}`.trim();
  const errorCategory = categorizeError(error);

  const stackTrace = errorInfo?.componentStack
    ?.split('\n')
    .slice(0, 10)
    .join('\n');

  const githubURL = encodeURI(
    `https://github.com/luke-h1/foam/issues/new?title=(CRASH) ${errorTitle}&body=What were you doing when the app crashed?\n\n\nTruncated Stacktrace:\n\`\`\`${stackTrace}\`\`\``,
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      contentInsetAdjustmentBehavior='automatic'
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <SymbolView
          name={{ ios: 'exclamationmark.triangle', android: 'warning' }}
          size={36}
          tintColor={theme.color.textSecondary.dark}
        />

        <Text type='lg' weight='semibold' align='center'>
          {errorCategory === 'network'
            ? 'Connection trouble'
            : 'Something went wrong'}
        </Text>

        <Text
          type='sm'
          color='gray.textLow'
          align='center'
          style={styles.description}
        >
          {getFriendlyErrorMessage(errorCategory)}
        </Text>

        <View style={styles.actionRow}>
          <Button
            style={styles.primaryButton}
            onPress={() => openLinkInBrowser(githubURL)}
          >
            <Text
              type='sm'
              weight='semibold'
              color='accent'
              contrast
              align='center'
            >
              GitHub
            </Text>
          </Button>

          <Button style={styles.secondaryButton} onPress={handleShowFeedback}>
            <Text type='sm' weight='semibold' color='gray' align='center'>
              Send Feedback
            </Text>
          </Button>
        </View>

        <Button
          style={styles.linkButton}
          onPress={() => showStackTrace$.set(value => !value)}
        >
          <Text
            type='sm'
            color='gray.textLow'
            align='center'
            style={styles.linkText}
          >
            {showStackTrace ? 'Hide Stack Trace' : 'Show Stack Trace'}
          </Text>
        </Button>
      </View>

      {showStackTrace ? (
        <View style={styles.errorCard}>
          <ScrollView
            style={styles.errorScrollView}
            contentContainerStyle={styles.errorContentContainer}
            showsVerticalScrollIndicator
          >
            {error?.message ? (
              <Text
                type='sm'
                weight='semibold'
                color='red'
                style={styles.errorMessage}
              >
                {error.message.trim()}
              </Text>
            ) : null}
            {errorInfo?.componentStack ? (
              <Text
                selectable
                type='xs'
                color='gray.textLow'
                style={styles.errorBackTrace}
              >
                {errorInfo.componentStack.trim()}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      ) : null}

      <Button
        style={styles.resetButton}
        onPress={() => {
          // Failed queries would re-render straight back into the error
          // state; clear them so the reset gets a clean fetch.
          void queryClient.resetQueries({
            predicate: query => query.state.status === 'error',
          });
          onReset();
        }}
      >
        <Text type='sm' weight='semibold' color='gray' contrast align='center'>
          Reset App
        </Text>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: theme.space12,
    marginTop: theme.space8,
    width: '100%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.space12,
    padding: theme.space24,
    width: '100%',
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    gap: theme.space16,
    justifyContent: 'center',
    paddingBottom: theme.space44,
    paddingHorizontal: theme.space24,
    paddingTop: theme.space56,
  },
  description: {
    lineHeight: theme.fontSize16 * 1.5,
  },
  errorBackTrace: {
    fontFamily: 'monospace',
    lineHeight: theme.fontSize12 * 1.5,
  },
  errorCard: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    width: '100%',
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
  linkButton: {
    paddingVertical: theme.space4,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: theme.colorRed,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.space24,
    paddingVertical: theme.space16,
    width: '100%',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundTertiary.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
});
