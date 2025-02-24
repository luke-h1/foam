import { Button, Icon, Screen, Typography } from '@app/components';
import { useHeader } from '@app/hooks';
import { openLinkInBrowser } from '@app/utils';
import React, { type ErrorInfo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export interface ErrorDetailsProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

export function ErrorDetails(props: ErrorDetailsProps) {
  const { styles } = useStyles(stylesheet);
  const { error, errorInfo, onReset } = props;
  const [showStackTrace, setShowStackTrace] = useState(false);
  useHeader({
    title: 'Error',
  });
  const errorTitle = `${error}`.trim();

  const stackTrace = errorInfo?.componentStack
    ?.split('\n')
    .slice(0, 10)
    .join('\n');

  const githubURL = encodeURI(
    `https://github.com/luke-h1/foam/issues/new?title=(CRASH) ${errorTitle}&body=What were you doing when the app crashed?\n\n\nTruncated Stacktrace:\n\`\`\`${stackTrace}\`\`\``,
  );

  return (
    <Screen preset="scroll">
      <View style={styles.topSection}>
        <Icon icon="alert-circle" size={30} />
        <Typography style={styles.heading}>Something went wrong</Typography>
        <Typography>
          Try resetting or restarting the app & see if that helps. If not, feel
          free to file an issue on GitHub and we'll take a look
        </Typography>
      </View>
      <Button
        style={styles.resetButton}
        onPress={() => openLinkInBrowser(githubURL)}
      >
        GitHub
      </Button>
      <TouchableOpacity onPress={() => setShowStackTrace(!showStackTrace)}>
        <Typography style={styles.toggleStackTrace}>
          {showStackTrace ? 'Hide Stack Trace' : 'Show Stack Trace'}
        </Typography>
      </TouchableOpacity>
      {showStackTrace && (
        <ScrollView
          style={styles.errorSection}
          contentContainerStyle={styles.errorSectionContentContainer}
        >
          <Typography weight="bold">{error?.message.trim()}</Typography>
          <Typography selectable style={styles.errorBackTrace} color="text">
            {errorInfo?.componentStack?.trim()}
          </Typography>
        </ScrollView>
      )}
      <Button style={styles.resetButton} onPress={onReset}>
        Reset
      </Button>
    </Screen>
  );
}

const stylesheet = createStyleSheet(theme => ({
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
