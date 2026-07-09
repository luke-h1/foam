import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  channel,
  checkForUpdateAsync,
  fetchUpdateAsync,
  reloadAsync,
  runtimeVersion,
  setUpdateRequestHeadersOverride,
  updateId,
} from 'expo-updates';

import { Button } from '@app/components/Button/Button';
import { Input } from '@app/components/ui/Input/Input';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { theme } from '@app/styles/themes';

export function ChannelSurfingScreen() {
  const { t } = useTranslation('devTools');
  const [channelInput, setChannelInput] = useState('');
  const [busy, setBusy] = useState(false);

  const surf = useCallback(async () => {
    const next = channelInput.trim();
    if (!next) {
      Alert.alert(
        i18next.t('devTools:enterChannel'),
        i18next.t('devTools:enterChannelHint'),
      );
      return;
    }
    setBusy(true);
    try {
      setUpdateRequestHeadersOverride({ 'expo-channel-name': next });
      const result = await checkForUpdateAsync();
      if (!result.isAvailable) {
        Alert.alert(
          i18next.t('devTools:noUpdateFound'),
          i18next.t('devTools:noUpdateFoundMessage', {
            channel: next,
            runtime: runtimeVersion,
          }),
        );
        setBusy(false);
        return;
      }
      // Strictly ordered: fetch the update, then reload.
      // eslint-disable-next-line react-doctor/async-parallel
      await fetchUpdateAsync();
      await reloadAsync();
    } catch (err) {
      setBusy(false);
      Alert.alert(
        i18next.t('devTools:failedToSurf'),
        err instanceof Error ? err.message : String(err),
      );
    }
  }, [channelInput]);

  const reset = useCallback(() => {
    Alert.alert(
      i18next.t('devTools:resetChannel'),
      i18next.t('devTools:resetChannelMessage'),
      [
        { text: i18next.t('common:cancel'), style: 'cancel' },
        {
          text: i18next.t('devTools:reset'),
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              setUpdateRequestHeadersOverride(null);
              await reloadAsync();
            } catch (err) {
              setBusy(false);
              Alert.alert(
                i18next.t('devTools:failedToReset'),
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
          <Row
            label={t('currentChannel')}
            value={channel || t('unknownValue')}
          />
          <Row
            label={t('runtimeVersion')}
            value={runtimeVersion ?? t('unknownValue')}
          />
          <Row label={t('updateId')} value={updateId ?? t('embeddedValue')} />
        </View>

        <Text color='gray.textLow' style={styles.hint} type='sm'>
          {t('channelHint')}
        </Text>

        <Input
          autoCapitalize='none'
          autoCorrect={false}
          editable={!busy}
          placeholder={t('channelPlaceholder')}
          value={channelInput}
          onChangeText={setChannelInput}
        />

        <View style={styles.actions}>
          <Button disabled={busy} onPress={surf} style={styles.primaryBtn}>
            <Text type='sm' weight='semibold' style={styles.primaryBtnText}>
              {busy ? t('loading') : t('surfToChannel')}
            </Text>
          </Button>
          <Button disabled={busy} onPress={reset} style={styles.secondaryBtn}>
            <Text type='sm' weight='semibold' color='red.accent'>
              {t('resetToBuildChannel')}
            </Text>
          </Button>
        </View>

        <Text color='gray.textLow' style={styles.footnote} type='xs'>
          {t('surfFootnote')}
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
