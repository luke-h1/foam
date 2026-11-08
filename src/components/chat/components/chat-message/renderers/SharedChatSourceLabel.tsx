import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { SymbolView } from '@app/components/ui/icon/Icon';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';

import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import { CHAT_SURFACE_COLORS, getChatScale } from '../util/chatScale';

interface SharedChatSourceLabelProps {
  density?: ChatDensity;
  fontScale?: ChatFontScale;
}

export function SharedChatSourceLabel({
  density,
  fontScale,
}: SharedChatSourceLabelProps) {
  const textStyles = getChatTextStyles(fontScale, density);

  return (
    <View
      style={[
        styles.sharedChatLabelRow,
        textStyles.stackGap,
        textStyles.spaceBelow,
      ]}
    >
      <SymbolView
        name='bubble.left.and.bubble.right.fill'
        size={getChatScale(fontScale, density).metaIconSize}
        tintColor={CHAT_SURFACE_COLORS.muted}
      />
      <ChatText style={[textStyles.meta, styles.sharedChatLabelText]}>
        Via shared chat
      </ChatText>
    </View>
  );
}
