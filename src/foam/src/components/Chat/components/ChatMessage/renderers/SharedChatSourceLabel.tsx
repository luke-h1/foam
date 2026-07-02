import { View } from 'react-native';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { theme } from '@app/styles/themes';

import { styles } from '../RichChatMessage.styles';

export function SharedChatSourceLabel() {
  return (
    <View style={styles.sharedChatLabelRow}>
      <SymbolView
        name='bubble.left.and.bubble.right.fill'
        size={12}
        tintColor={theme.color.notice.muted}
      />
      <Text style={styles.sharedChatLabelText}>
        {i18next.t('chat:notices.viaSharedChat')}
      </Text>
    </View>
  );
}
