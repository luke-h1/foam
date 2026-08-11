import { View } from 'react-native';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';

import {
  CHAT_SURFACE_COLORS,
  type ChatFontScale,
  densityFromCompact,
  getChatScale,
} from '../chatScale';
import { getChatTextStyles } from '../chatText.styles';
import { styles } from '../RichChatMessage.styles';

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
      <Text
        style={[
          getChatTextStyles(fontScale, compact).meta,
          styles.sharedChatLabelText,
        ]}
      >
        Via shared chat
      </Text>
    </View>
  );
}
