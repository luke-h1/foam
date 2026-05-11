import { type ErrorBoundaryProps, useRouter, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useEffect, useMemo } from 'react';
import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { recordError } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';

export default function AppError({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();

  const errorMessage = useMemo(() => {
    if (error.message && error.message.trim().length > 0) {
      return error.message;
    }

    return 'An unexpected issue interrupted the app.';
  }, [error.message]);

  useEffect(() => {
    recordError({
      name: 'ErrorBoundaryError',
      message: errorMessage,
      params: {
        category: 'ErrorBoundary',
        action: 'router_500_screen',
        isRecoverable: true,
      },
      errorCause: error,
    });
  }, [errorMessage, error]);

  return (
    <>
      <Stack.Screen options={{ title: 'Something went wrong' }} />
      <View style={styles.container}>
        <Text type="title" color="gray" align="center" style={styles.title}>
          Something went wrong
        </Text>
        <Text
          type="sm"
          color="gray.textLow"
          align="center"
          style={styles.subtitle}
        >
          {errorMessage}
        </Text>

        <Button style={styles.button} onPress={() => void retry()}>
          <Text type="md" color="accent" weight="semibold" align="center">
            Try again
          </Text>
        </Button>

        <Button
          style={styles.secondaryButton}
          onPress={() => {
            router.replace('/');
          }}
        >
          <Text type="sm" color="gray" align="center">
            Go home
          </Text>
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: theme.colorGreen,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    justifyContent: 'center',
    marginBottom: theme.space16,
    paddingHorizontal: theme.space28,
    paddingVertical: theme.space16,
    width: '100%',
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space36,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: theme.space16,
    paddingHorizontal: theme.space28,
    paddingVertical: theme.space16,
    width: '100%',
  },
  subtitle: {
    lineHeight: theme.fontSize16 * 1.35,
    marginBottom: theme.space24,
  },
  title: {
    marginBottom: theme.space8,
    textAlign: 'center',
  },
});
