import { Button } from '@app/components/Button/Button';
import { Input } from '@app/components/ui/Input/Input';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import {
  channel,
  checkForUpdateAsync,
  fetchUpdateAsync,
  reloadAsync,
  runtimeVersion,
  setUpdateRequestHeadersOverride,
  updateId,
} from 'expo-updates';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

export function ChannelSurfingScreen() {
  const [channelInput, setChannelInput] = useState('');
  const [busy, setBusy] = useState(false);

  const surf = useCallback(async () => {
    const next = channelInput.trim();
    if (!next) {
      Alert.alert('Enter a channel', 'e.g. pr-123, internal, testflight');
      return;
    }
    setBusy(true);
    try {
      setUpdateRequestHeadersOverride({ 'expo-channel-name': next });
      const result = await checkForUpdateAsync();
      if (!result.isAvailable) {
        Alert.alert(
          'No update found',
          `No update available on channel "${next}" for runtime ${runtimeVersion}.`,
        );
        setBusy(false);
        return;
      }
      await fetchUpdateAsync();
      await reloadAsync();
    } catch (err) {
      setBusy(false);
      Alert.alert(
        'Failed to surf',
        err instanceof Error ? err.message : String(err),
      );
    }
  }, [channelInput]);

  const reset = useCallback(() => {
    Alert.alert(
      'Reset channel?',
      'Returns to the original build channel and reloads.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              setUpdateRequestHeadersOverride(null);
              await reloadAsync();
            } catch (err) {
              setBusy(false);
              Alert.alert(
                'Failed to reset',
                err instanceof Error ? err.message : String(err),
              );
            }
          },
        },
      ],
    );
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={styles.content}
      >
        <View style={styles.info}>
          <Row label='Current channel' value={channel || 'unknown'} />
          <Row label='Runtime version' value={runtimeVersion ?? 'unknown'} />
          <Row label='Update ID' value={updateId ?? 'embedded'} />
        </View>

        <Text color='gray.textLow' style={styles.hint} type='sm'>
          Enter the channel (or branch mapped to a channel) you want to load.
          For PR previews this is typically pr-&lt;number&gt;.
        </Text>

        <Input
          autoCapitalize='none'
          autoCorrect={false}
          editable={!busy}
          placeholder='e.g. pr-579'
          value={channelInput}
          onChangeText={setChannelInput}
        />

        <View style={styles.actions}>
          <Button disabled={busy} onPress={surf} style={styles.primaryBtn}>
            <Text type='sm' weight='semibold' style={styles.primaryBtnText}>
              {busy ? 'Loading…' : 'Surf to channel'}
            </Text>
          </Button>
          <Button disabled={busy} onPress={reset} style={styles.secondaryBtn}>
            <Text type='sm' weight='semibold' color='red.accent'>
              Reset to build channel
            </Text>
          </Button>
        </View>

        <Text color='gray.textLow' style={styles.footnote} type='xs'>
          A bad update on the chosen channel can leave the app unable to start.
          If that happens, force-quit and reopen — the build channel is restored
          on next launch via the embedded bundle.
        </Text>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text color='gray.textLow' type='sm'>
        {label}
      </Text>
      <Text type='sm'>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: theme.space12,
    marginTop: theme.space16,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  footnote: {
    marginTop: theme.space20,
  },
  hint: {
    marginTop: theme.space20,
  },
  info: {
    backgroundColor: theme.color.background.darkAlt,
    borderRadius: theme.space12,
    marginTop: theme.space16,
    padding: theme.space16,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: theme.colorBlue,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space12,
  },
  primaryBtnText: {
    color: '#fff',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.space4,
  },
});
