import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { getSentryStatus, verifySentryDelivery } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';

function SentryTestError() {
  throw new Error('Sentry test error from Foam dev tools');

  return null;
}

type DeliveryState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'done'; eventId: string | undefined; flushed: boolean };

export function SentryTestScreen() {
  const { t } = useTranslation('devTools');
  const [shouldThrow, setShouldThrow] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryState>({ status: 'idle' });

  const status = getSentryStatus();

  async function handleVerifyDelivery() {
    setDelivery({ status: 'sending' });
    try {
      const result = await verifySentryDelivery();
      setDelivery({
        status: 'done',
        eventId: result.eventId,
        flushed: result.flushed,
      });
    } catch {
      setDelivery({ status: 'done', eventId: undefined, flushed: false });
    }
  }

  return (
    <View style={styles.screenContainer}>
      {shouldThrow ? <SentryTestError /> : null}
      <ScrollView
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={styles.content}
      >
        {Platform.OS === 'ios' ? null : (
          <Text type='xl' weight='bold' style={styles.title}>
            {t('sentryTest')}
          </Text>
        )}

        <View style={styles.panel}>
          <Text weight='semibold'>{t('sentryStatus')}</Text>
          <StatusRow
            label={t('enabled')}
            value={status.enabled ? t('yes') : t('no')}
            warn={!status.enabled}
          />
          <StatusRow
            label={t('dsn')}
            value={status.hasDsn ? t('present') : t('missing')}
            warn={!status.hasDsn}
          />
          <StatusRow label={t('environment')} value={status.environment} />
          <StatusRow
            label={t('release')}
            value={status.release ?? t('unknown')}
          />
          <StatusRow label={t('dist')} value={status.dist ?? t('unknown')} />
          <StatusRow
            label={t('debug')}
            value={status.debug ? t('yes') : t('no')}
          />
        </View>

        <View style={styles.panel}>
          <Text weight='semibold'>{t('verifyDelivery')}</Text>
          <Text type='xs' color='gray.textLow'>
            {t('verifyDeliveryDescription')}
          </Text>

          <Button
            accessibilityRole='button'
            label={t('verifyDelivery')}
            onPress={handleVerifyDelivery}
            disabled={delivery.status === 'sending'}
            style={styles.verifyButton}
          >
            <Text type='sm' weight='semibold' style={styles.verifyButtonText}>
              {delivery.status === 'sending'
                ? t('sending')
                : t('verifyDelivery')}
            </Text>
          </Button>

          {delivery.status === 'done' ? (
            <Text
              type='xs'
              color={delivery.flushed ? 'gray' : 'gray.textLow'}
              style={styles.result}
            >
              {delivery.flushed
                ? t('deliveryConfirmed', { id: delivery.eventId ?? '—' })
                : t('deliveryFailed')}
            </Text>
          ) : null}
        </View>

        <View style={styles.panel}>
          <Text weight='semibold'>{t('throwTestError')}</Text>
          <Text type='xs' color='gray.textLow'>
            {t('throwTestErrorDescription')}
          </Text>

          <Button
            accessibilityRole='button'
            label={t('throwSentryTestError')}
            onPress={() => setShouldThrow(true)}
            style={styles.errorButton}
          >
            <Text type='sm' weight='semibold' style={styles.errorButtonText}>
              {t('throwError')}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

function StatusRow({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <View style={styles.statusRow}>
      <Text type='sm' color='gray.textLow'>
        {label}
      </Text>
      <Text
        type='sm'
        weight='semibold'
        color='gray'
        style={warn ? styles.warnValue : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.space16,
    padding: theme.space20,
    paddingBottom: 100,
  },
  errorButton: {
    alignItems: 'center',
    backgroundColor: theme.colorRed,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    marginTop: theme.space20,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space12,
  },
  errorButtonText: {
    color: '#fff',
  },
  panel: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    gap: theme.space8,
    padding: theme.space16,
  },
  result: {
    marginTop: theme.space12,
  },
  screenContainer: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    marginBottom: theme.space28,
  },
  verifyButton: {
    alignItems: 'center',
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    marginTop: theme.space12,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space12,
  },
  verifyButtonText: {
    color: '#fff',
  },
  warnValue: {
    color: theme.colorAmber,
  },
});
