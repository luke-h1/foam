import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import type { ChatDebugIrcLine } from '@app/store/chat/actions/chatDebugLog';
import { usePreference } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { isDevToolsEnabled } from '@app/utils/devTools/isDevToolsEnabled';

export interface ChatDebugSectionData {
  payload: Record<string, unknown>;
  ircLines?: ChatDebugIrcLine[];
}

interface ChatDebugSectionProps {
  build: () => ChatDebugSectionData;
  style?: StyleProp<ViewStyle>;
}

export function ChatDebugSection({ build, style }: ChatDebugSectionProps) {
  const { t } = useTranslation('chat');
  const chatDebugTools = usePreference('chatDebugTools');
  const data = isDevToolsEnabled && chatDebugTools ? build() : null;

  if (!data) {
    return null;
  }

  const payloadJson = JSON.stringify(data.payload, null, 2);
  const handleCopy = () => {
    const clipboardPayload = data.ircLines
      ? `${payloadJson}\n\n${data.ircLines.map(entry => entry.line).join('\n')}`
      : payloadJson;
    Clipboard.setStringAsync(clipboardPayload)
      .then(() => toast.success(t('debug.copied')))
      .catch(() => toast.error(t('debug.copyFailed')));
  };

  return (
    <View style={[styles.card, style]} testID='chat-debug-section'>
      <View style={styles.headerRow}>
        <Text style={styles.title} weight='semibold'>
          {t('debug.title')}
        </Text>
        <Button
          label={t('debug.copy')}
          style={styles.copyButton}
          onPress={handleCopy}
        >
          <SymbolView
            name='doc.on.doc'
            size={13}
            tintColor={theme.color.textSecondary.dark}
          />
        </Button>
      </View>

      <Text selectable style={styles.mono} variant='mono'>
        {payloadJson}
      </Text>

      {data.ircLines ? (
        <>
          <Text style={styles.subheading} weight='semibold'>
            {t('debug.ircLines')}
          </Text>
          {data.ircLines.length === 0 ? (
            <Text style={styles.empty}>{t('debug.ircLinesEmpty')}</Text>
          ) : (
            data.ircLines.map((entry, index) => (
              <Text
                key={`${entry.receivedAt}_${index}`}
                selectable
                style={styles.mono}
                variant='mono'
              >
                {entry.dropped ? `[${t('debug.dropped')}] ` : ''}
                {entry.line}
              </Text>
            ))
          )}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    gap: theme.space8,
    padding: theme.space12,
  },
  copyButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  empty: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mono: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    lineHeight: theme.fontSize11 * 1.45,
  },
  subheading: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0.2,
    marginTop: theme.space4,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
