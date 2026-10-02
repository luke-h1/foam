import { ScrollView, StyleSheet, View } from 'react-native';
import type { ErrorInfo } from 'react';

import { useObservable, useSelector } from '@legendapp/state/react';
import { router } from 'expo-router';

import { ActionButton } from '@app/components/action-button/action-button';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { queryClient } from '@app/lib/react-query/query-client';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/open-link-in-browser';
import {
  categorizeError,
  getFriendlyErrorMessage,
} from '@app/utils/errors/categorize-error';

export interface ErrorDetailsProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function handleShowFeedback() {
  router.push('/feedback');
}

export function ErrorDetails({ error, errorInfo, onReset }: ErrorDetailsProps) {
  const showDetails$ = useObservable(false);
  const showDetails = useSelector(showDetails$);

  const errorTitle = `${error}`.trim();
  const errorCategory = categorizeError(error);

  const stackTrace = errorInfo?.componentStack
    ?.split('\n')
    .slice(0, 10)
    .join('\n');

  const githubURL = encodeURI(
    `https://github.com/luke-h1/foam/issues/new?title=(CRASH) ${errorTitle}&body=What were you doing when the app crashed?\n\n\nTruncated Stacktrace:\n\`\`\`${stackTrace}\`\`\``,
  );

  const handleTryAgain = () => {
    // Reset the failed queries. Otherwise the screen renders the same error
    // again right after the reset.
    void queryClient.resetQueries({
      predicate: query => query.state.status === 'error',
    });
    onReset();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      contentInsetAdjustmentBehavior='automatic'
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.summary}>
        <SymbolView
          name={{ ios: 'exclamationmark.triangle', android: 'warning' }}
          size={44}
          tintColor={theme.color.textSecondary.dark}
        />

        <Text type='title2' align='center'>
          {errorCategory === 'network'
            ? 'Connection trouble'
            : 'Something went wrong'}
        </Text>

        <Text type='body' color='gray.textLow' align='center'>
          {getFriendlyErrorMessage(errorCategory)}
        </Text>
      </View>

      <View style={styles.actions}>
        <ActionButton title='Try again' onPress={handleTryAgain} />
        <ActionButton
          title='Report a problem'
          variant='secondary'
          onPress={handleShowFeedback}
        />
        <View style={styles.links}>
          <ActionButton
            title='Open a GitHub issue'
            variant='plain'
            size='small'
            onPress={() => openLinkInBrowser(githubURL)}
          />
          <ActionButton
            title={showDetails ? 'Hide details' : 'Show details'}
            variant='plain'
            size='small'
            onPress={() => showDetails$.set(value => !value)}
          />
        </View>
      </View>

      {showDetails ? (
        <View style={styles.details}>
          <ScrollView
            style={styles.detailsScroll}
            contentContainerStyle={styles.detailsContent}
            showsVerticalScrollIndicator
          >
            {error?.message ? (
              <Text type='subhead' weight='semibold' color='red' selectable>
                {error.message.trim()}
              </Text>
            ) : null}
            {errorInfo?.componentStack ? (
              <Text
                selectable
                type='footnote'
                variant='mono'
                color='gray.textLow'
              >
                {errorInfo.componentStack.trim()}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignSelf: 'stretch',
    gap: theme.space12,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    gap: theme.space36,
    justifyContent: 'center',
    paddingBottom: theme.space44,
    paddingHorizontal: theme.space24,
    paddingTop: theme.space56,
  },
  details: {
    backgroundColor: theme.color.surface.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    maxHeight: 280,
    overflow: 'hidden',
  },
  detailsContent: {
    gap: theme.space12,
    padding: theme.space16,
  },
  detailsScroll: {
    flexGrow: 0,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  summary: {
    alignItems: 'center',
    gap: theme.space12,
  },
});
