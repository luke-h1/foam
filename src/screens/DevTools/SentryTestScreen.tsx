import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

function SentryTestError() {
  throw new Error('Sentry test error from Foam dev tools');

  return null;
}

export function SentryTestScreen() {
  const [shouldThrow, setShouldThrow] = useState(false);

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

const styles = StyleSheet.create({
  content: {
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
  screenContainer: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  title: {
    marginBottom: theme.space28,
  },
});
