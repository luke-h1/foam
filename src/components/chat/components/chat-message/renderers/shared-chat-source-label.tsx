import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { SymbolView } from '@app/components/ui/icon/icon';

import { styles } from '../chat-row.styles';
import { getChatTextStyles } from '../chat-text.styles';
import {
  CHAT_SURFACE_COLORS,
  type ChatFontScale,
  densityFromCompact,
  getChatScale,
} from '../util/chat-scale';

interface SharedChatSourceLabelProps {
  compact?: boolean;
  fontScale?: ChatFontScale;
}

export function SharedChatSourceLabel({
  compact,
  fontScale,
}: SharedChatSourceLabelProps) {
  return (
    <View style={styles.sharedChatLabelRow}>
      <SymbolView
        name='bubble.left.and.bubble.right.fill'
        size={getChatScale(fontScale, densityFromCompact(compact)).metaIconSize}
        tintColor={CHAT_SURFACE_COLORS.muted}
      />
      <ChatText
        style={[
          getChatTextStyles(fontScale, compact).meta,
          styles.sharedChatLabelText,
        ]}
      >
        Via shared chat
      </ChatText>
    </View>
  );
}
