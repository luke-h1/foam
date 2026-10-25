import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { SymbolView } from '@app/components/ui/icon/Icon';

import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import {
  CHAT_SURFACE_COLORS,
  type ChatFontScale,
  densityFromCompact,
  getChatScale,
} from '../util/chatScale';

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
