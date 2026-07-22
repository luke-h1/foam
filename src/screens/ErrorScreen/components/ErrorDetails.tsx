import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import type { ErrorInfo } from 'react';
import { useTranslation } from 'react-i18next';

import { useObservable, useSelector } from '@legendapp/state/react';
import { router } from 'expo-router';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { queryClient } from '@app/lib/react-query/query-client';
import { lastEventId, sendFeedback } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';
import {
  categorizeError,
  getFriendlyErrorMessage,
} from '@app/utils/errors/categorizeError';

export interface ErrorDetailsProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function handleShowFeedback() {
  router.push('/feedback');
}

export function ErrorDetails(props: ErrorDetailsProps) {
  const { t } = useTranslation('errors');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const { error, errorInfo, onReset } = props;
  const showStackTrace$ = useObservable(false);
  const showStackTrace = useSelector(showStackTrace$);
  const reported$ = useObservable(false);
  const reported = useSelector(reported$);

  const errorTitle = `${error}`.trim();
  const errorCategory = categorizeError(error);

  const stackTrace = errorInfo?.componentStack
    ?.split('\n')
    .slice(0, 10)
    .join('\n');

  const handleReportBug = () => {
    if (reported$.peek()) {
      return;
    }
    sendFeedback({
      type: 'bug',
      message: stackTrace
        ? `(CRASH) ${errorTitle}\n\nTruncated stack trace:\n${stackTrace}`
        : `(CRASH) ${errorTitle}`,
      associatedEventId: lastEventId(),
    });
    reported$.set(true);
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
      contentContainerStyle={styles.contentContainer}
      contentInsetAdjustmentBehavior='automatic'
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.color.backgroundSecondary[scheme],
            borderColor: theme.color.border[scheme],
          },
        ]}
      >
        <SymbolView
          name={{ ios: 'exclamationmark.triangle', android: 'warning' }}
          size={36}
          tintColor={theme.color.textSecondary[scheme]}
        />

        <Text type='lg' weight='semibold' align='center'>
          {errorCategory === 'network'
            ? t('connectionTrouble')
            : t('somethingWentWrong')}
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
            style={[
              styles.primaryButton,
              { backgroundColor: theme.color.accent[scheme] },
              reported && styles.primaryButtonDisabled,
            ]}
            disabled={reported}
            onPress={handleReportBug}
          >
            <Text
              type='sm'
              weight='semibold'
              color='accent'
              contrast
              align='center'
            >
              {reported ? t('bugReportSent') : t('reportBug')}
            </Text>
          </Button>

          <Button
            style={[
              styles.secondaryButton,
              {
                backgroundColor: theme.color.backgroundTertiary[scheme],
                borderColor: theme.color.border[scheme],
              },
            ]}
            onPress={handleShowFeedback}
          >
            <Text type='sm' weight='semibold' color='gray' align='center'>
              {t('sendFeedback')}
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
            {showStackTrace ? t('hideStackTrace') : t('showStackTrace')}
          </Text>
        </Button>
      </View>

      {showStackTrace ? (
        <View
          style={[
            styles.errorCard,
            {
              backgroundColor: theme.color.backgroundSecondary[scheme],
              borderColor: theme.color.border[scheme],
            },
          ]}
        >
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
        style={[
          styles.resetButton,
          { backgroundColor: theme.color.danger[scheme] },
        ]}
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.space12,
    padding: theme.space24,
    width: '100%',
  },
  container: {
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  resetButton: {
    alignItems: 'center',
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
