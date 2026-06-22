import { Text } from '@app/components/ui/Text/Text';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import type { ReactNode } from 'react';
import { View, type StyleProp, type TextStyle } from 'react-native';

import { styles } from '../RichChatMessage.styles';

interface ChatNoticeMetaRowProps {
  compact?: boolean;
  icon: React.ComponentProps<typeof SymbolView>['name'];
  label?: string;
  labelColor?: string;
  children?: ReactNode;
  labelStyle?: StyleProp<TextStyle>;
}

export function ChatNoticeMetaRow({
  children,
  compact,
  icon,
  label,
  labelColor,
  labelStyle,
}: ChatNoticeMetaRowProps) {
  return (
    <View style={styles.messageMetaRow}>
      <SymbolView
        name={icon}
        size={12}
        tintColor={labelColor ?? 'rgba(255, 255, 255, 0.5)'}
        style={styles.replyContextIcon}
      />
      {children ?? (
        <Text
          style={[
            styles.messageMetaText,
            styles.messageMetaTextStrong,
            compact && styles.messageMetaTextCompact,
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
