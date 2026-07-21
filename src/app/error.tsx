import { useEffect } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type ErrorBoundaryProps, router, Stack } from 'expo-router';

import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { Button } from '@app/components/Button/Button';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { logger } from '@app/utils/logger';

function handleReportBug() {
  router.push('/feedback');
}

export default function AppError({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation(['errors', 'common']);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const errorMessage = t('unexpectedIssue');

  useEffect(() => {
    logger.main.error(errorMessage, {
      name: 'error_boundary_error',
      error,
      category: 'ErrorBoundary',
      action: 'router_500_screen',
      isRecoverable: true,
    });
  }, [errorMessage, error]);

  return (
    <>
      <Stack.Screen options={{ title: t('somethingWentWrong') }} />
      <View
        style={[
          styles.container,
          { backgroundColor: theme.color.background[scheme] },
        ]}
      >
        <ScreenHeader
          title={t('somethingWentWrong')}
          subtitle={t('recovery')}
          size='medium'
          back={false}
        />

        <BodyScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View
            style={[
              styles.panel,
              {
                backgroundColor: theme.color.backgroundAltAlpha[scheme],
                borderColor: theme.color.border[scheme],
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: theme.color.amberAlpha[scheme],
                  borderColor: theme.color.borderStrong[scheme],
                },
              ]}
            >
              <SymbolView
                name='exclamationmark.triangle'
                size={22}
                tintColor={theme.color.amber[scheme]}
              />
            </View>

            <View style={styles.copy}>
              <Text type='lg' weight='semibold' color='gray'>
                {t('screenCrashed')}
              </Text>
              <Text type='sm' color='gray.textLow' style={styles.body}>
                {t('tryLoadingAgain')}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: theme.color.backgroundSecondary[scheme],
                borderColor: theme.color.border[scheme],
              },
            ]}
          >
            <Text
              type='xs'
              weight='semibold'
              color='gray.textLow'
              style={styles.sectionLabel}
            >
              {t('messageLabel')}
            </Text>
            <Text type='sm' color='gray' selectable style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              style={[
                styles.primaryButton,
                { backgroundColor: theme.color.accent[scheme] },
              ]}
              onPress={() => void retry()}
            >
              <Text
                type='sm'
                color='accent'
                contrast
                weight='semibold'
                align='center'
              >
                {t('common:tryAgain')}
              </Text>
            </Button>

            <Button
              style={[
                styles.reportButton,
                {
                  backgroundColor: theme.color.amberAlpha[scheme],
                  borderColor: theme.color.borderStrong[scheme],
                },
              ]}
              onPress={handleReportBug}
            >
              <Text type='sm' color='gray' weight='semibold' align='center'>
                {t('reportBug')}
              </Text>
            </Button>

            <Button
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: theme.color.backgroundSecondary[scheme],
                  borderColor: theme.color.border[scheme],
                },
              ]}
              onPress={() => {
                router.replace('/');
              }}
            >
              <Text type='sm' color='gray' weight='semibold' align='center'>
                {t('goHome')}
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  panel: {
    alignItems: 'flex-start',
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.space24,
    paddingVertical: theme.space16,
  },
  reportButton: {
    alignItems: 'center',
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
