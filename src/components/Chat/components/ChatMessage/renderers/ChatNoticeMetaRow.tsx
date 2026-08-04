import { type StyleProp, type TextStyle, View } from 'react-native';
import type { ReactNode } from 'react';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';

import { CHAT_SURFACE_COLORS, type ChatFontScale } from '../chatScale';
import { getChatTextStyles } from '../chatTextStyles';
import { styles } from '../RichChatMessage.styles';

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
        <Text
          style={[
            textStyles.meta,
            styles.messageMetaTextFlex,
            textStyles.metaStrong,
            labelColor ? { color: labelColor } : null,
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}
