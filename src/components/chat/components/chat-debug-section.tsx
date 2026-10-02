import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import { Button } from '@app/components/button/button';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import type { ChatDebugIrcLine } from '@app/store/chat/actions/chat-debug-log';
import { usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import { isDevToolsEnabled } from '@app/utils/dev-tools/is-dev-tools-enabled';

export interface ChatDebugSectionData<TPayload> {
  payload: TPayload;
  ircLines?: ChatDebugIrcLine[];
}

interface ChatDebugSectionProps<TPayload> {
  build: () => ChatDebugSectionData<TPayload>;
  style?: StyleProp<ViewStyle>;
}

export function ChatDebugSection<TPayload>({
  build,
  style,
}: ChatDebugSectionProps<TPayload>) {
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
      .then(() => toast.success('Debug info copied'))
      .catch(() => toast.error('Could not copy debug info'));
  };

  return (
    <View style={[styles.card, style]} testID='chat-debug-section'>
      <View style={styles.headerRow}>
        <Text
          type='callout'
          family='brand'
          style={styles.title}
          weight='semibold'
        >
          Debug
        </Text>
        <Button
          label='Copy debug info'
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

      <Text
        type='callout'
        family='brand'
        selectable
        style={styles.mono}
        variant='mono'
      >
        {payloadJson}
      </Text>

      {data.ircLines ? (
        <>
          <Text
            type='callout'
            family='brand'
            style={styles.subheading}
            weight='semibold'
          >
            Raw IRC lines
          </Text>
          {data.ircLines.length === 0 ? (
            <Text type='callout' family='brand' style={styles.empty}>
              No captured IRC lines for this user
            </Text>
          ) : (
            data.ircLines.map(entry => (
              <Text
                type='callout'
                family='brand'
                key={`${entry.receivedAt}_${entry.line}`}
                selectable
                style={styles.mono}
                variant='mono'
              >
                {entry.dropped ? '[DROPPED] ' : ''}
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
    borderRadius: theme.radius.lg,
    gap: theme.space8,
    padding: theme.space12,
  },
  copyButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderCurve: 'continuous',
    borderRadius: theme.radius.full,
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
