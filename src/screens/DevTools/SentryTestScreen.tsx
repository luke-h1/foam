import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { getSentryStatus, verifySentryDelivery } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';

function SentryTestError(): never {
  throw new Error('Sentry test error from Foam dev tools');
}

type DeliveryState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'done'; eventId: string | undefined; flushed: boolean };

export function SentryTestScreen() {
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
            Sentry Test
          </Text>
        )}

        <View style={styles.panel}>
          <Text weight='semibold'>Sentry status</Text>
          <StatusRow
            label='Enabled'
            value={status.enabled ? 'Yes' : 'No'}
            warn={!status.enabled}
          />
          <StatusRow
            label='DSN'
            value={status.hasDsn ? 'present' : 'missing'}
            warn={!status.hasDsn}
          />
          <StatusRow label='Environment' value={status.environment} />
          <StatusRow label='Release' value={status.release ?? 'Unknown'} />
          <StatusRow label='Dist' value={status.dist ?? 'Unknown'} />
          <StatusRow label='Debug' value={status.debug ? 'Yes' : 'No'} />
        </View>

        <View style={styles.panel}>
          <Text weight='semibold'>Verify delivery</Text>
          <Text type='xs' color='gray.textLow'>
            Sends a message event and waits for the network flush, confirming
            Sentry capture works end-to-end from this build.
          </Text>

          <Button
            accessibilityRole='button'
            label='Verify delivery'
            onPress={handleVerifyDelivery}
            disabled={delivery.status === 'sending'}
            style={styles.verifyButton}
          >
            <Text type='sm' weight='semibold' style={styles.verifyButtonText}>
              {delivery.status === 'sending' ? 'Sending…' : 'Verify delivery'}
            </Text>
          </Button>

          {delivery.status === 'done' ? (
            <Text
              type='xs'
              color={delivery.flushed ? 'gray' : 'gray.textLow'}
              style={styles.result}
            >
              {delivery.flushed
                ? `Delivered ✓ (event ${delivery.eventId ?? '—'})`
                : 'Flush failed - event was not confirmed sent.'}
            </Text>
          ) : null}
        </View>

        <View style={styles.panel}>
          <Text weight='semibold'>Throw test error</Text>
          <Text type='xs' color='gray.textLow'>
            Sends an unhandled JavaScript error through the app error boundary
            and Sentry wrapper.
          </Text>

          <Button
            accessibilityRole='button'
            label='Throw Sentry test error'
            onPress={() => setShouldThrow(true)}
            style={styles.errorButton}
          >
            <Text type='sm' weight='semibold' style={styles.errorButtonText}>
              Throw Error
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
