import { View } from 'react-native';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';

import { CHAT_SURFACE_COLORS, type ChatFontScale } from '../chatScale';
import { getChatTextStyles } from '../chatTextStyles';
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
        size={12}
        tintColor={CHAT_SURFACE_COLORS.muted}
      />
      <Text
        style={[
          getChatTextStyles(fontScale, compact).meta,
          styles.sharedChatLabelText,
        ]}
      >
        {i18next.t('chat:notices.viaSharedChat')}
      </Text>
    </View>
  );
}
