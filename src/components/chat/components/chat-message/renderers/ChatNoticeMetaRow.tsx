import { type StyleProp, type TextStyle, View } from 'react-native';
import type { ReactNode } from 'react';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { SymbolView } from '@app/components/ui/icon/Icon';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';

import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import { CHAT_SURFACE_COLORS, getChatScale } from '../util/chatScale';

interface ChatNoticeMetaRowProps {
  density?: ChatDensity;
  fontScale?: ChatFontScale;
  icon: React.ComponentProps<typeof SymbolView>['name'];
  label?: string;
  labelColor?: string;
  children?: ReactNode;
  labelStyle?: StyleProp<TextStyle>;
}

export function ChatNoticeMetaRow({
  children,
  density,
  fontScale,
  icon,
  label,
  labelColor,
  labelStyle,
}: ChatNoticeMetaRowProps) {
  const textStyles = getChatTextStyles(fontScale, density);

  return (
    <View style={[styles.messageMetaRow, textStyles.spaceBelow]}>
      <SymbolView
        name={icon}
        size={getChatScale(fontScale, density).metaIconSize}
        tintColor={labelColor ?? CHAT_SURFACE_COLORS.muted}
        style={textStyles.iconSpacing}
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
