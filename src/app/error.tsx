import { type ErrorBoundaryProps, useRouter, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useEffect, useMemo } from 'react';
import { Button } from '@app/components/Button/Button';
import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { SymbolView } from 'expo-symbols';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/ui/Text/Text';
import { recordError, sentryService } from '@app/lib/sentry';
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

  const handleReportBug = () => {
    sentryService.showFeedbackWidget();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Something went wrong' }} />
      <View style={styles.container}>
        <ScreenHeader
          title="Something went wrong"
          subtitle="Recovery"
          size="medium"
          back={false}
        />

        <BodyScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.panel}>
            <View style={styles.iconWrap}>
              <SymbolView
                name="exclamationmark.triangle"
                size={22}
                tintColor={theme.colorAmber}
              />
            </View>

            <View style={styles.copy}>
              <Text type="lg" weight="semibold" color="gray">
                This screen crashed
              </Text>
              <Text type="sm" color="gray.textLow" style={styles.body}>
                Try loading it again. If it keeps failing, report a bug
              </Text>
            </View>
          </View>

          <View style={styles.errorCard}>
            <Text
              type="xs"
              weight="semibold"
              color="gray.textLow"
              style={styles.sectionLabel}
            >
              MESSAGE
            </Text>
            <Text type="sm" color="gray" selectable style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button style={styles.primaryButton} onPress={() => void retry()}>
              <Text
                type="sm"
                color="accent"
                contrast
                weight="semibold"
                align="center"
              >
                Try again
              </Text>
            </Button>

            <Button style={styles.reportButton} onPress={handleReportBug}>
              <Text type="sm" color="gray" weight="semibold" align="center">
                Report bug
              </Text>
            </Button>

            <Button
              style={styles.secondaryButton}
              onPress={() => {
                router.replace('/');
              }}
            >
              <Text type="sm" color="gray" weight="semibold" align="center">
                Go home
              </Text>
            </Button>
          </View>
        </BodyScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  actions: {
    gap: theme.space12,
    marginTop: theme.space20,
  },
  body: {
    lineHeight: theme.fontSize16 * 1.5,
  },
  content: {
    flexGrow: 1,
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space12,
  },
  copy: {
    flex: 1,
    gap: theme.space8,
    minWidth: 0,
  },
  errorCard: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: theme.space16,
  },
  errorText: {
    lineHeight: theme.fontSize16 * 1.45,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: theme.colorAmberAlpha,
    borderColor: theme.colorBorderTertiary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  panel: {
    alignItems: 'flex-start',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space16,
    marginBottom: theme.space16,
    padding: theme.space20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colorDarkGreen,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.space24,
    paddingVertical: theme.space16,
  },
  reportButton: {
    alignItems: 'center',
    backgroundColor: theme.colorAmberAlpha,
    borderColor: theme.colorBorderTertiary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.space24,
    paddingVertical: theme.space16,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.space24,
    paddingVertical: theme.space16,
  },
  sectionLabel: {
    marginBottom: theme.space8,
  },
});
