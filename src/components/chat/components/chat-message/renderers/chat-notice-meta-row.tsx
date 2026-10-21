import { type StyleProp, type TextStyle, View } from 'react-native';
import type { ReactNode } from 'react';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { SymbolView } from '@app/components/ui/icon/icon';

import { styles } from '../chat-row.styles';
import { getChatTextStyles } from '../chat-text.styles';
import { CHAT_SURFACE_COLORS, type ChatFontScale } from '../util/chat-scale';

interface ChatNoticeMetaRowProps {
  compact?: boolean;
  fontScale?: ChatFontScale;
  icon: React.ComponentProps<typeof SymbolView>['name'];
  label?: string;
  labelColor?: string;
  children?: ReactNode;
  labelStyle?: StyleProp<TextStyle>;
}

export function ChatNoticeMetaRow({
  children,
  compact,
  fontScale,
  icon,
  label,
  labelColor,
  labelStyle,
}: ChatNoticeMetaRowProps) {
  const textStyles = getChatTextStyles(fontScale, compact);

  return (
    <View style={styles.messageMetaRow}>
      <SymbolView
        name={icon}
        size={12}
        tintColor={labelColor ?? CHAT_SURFACE_COLORS.muted}
        style={styles.replyContextIcon}
      />
      {children ?? (
        <ChatText
          style={[
            textStyles.meta,
            styles.messageMetaTextFlex,
            textStyles.metaStrong,
            labelColor ? { color: labelColor } : null,
            labelStyle,
          ]}
        >
          {label}
        </ChatText>
      )}
    </View>
  );
}
