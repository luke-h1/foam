import { Text } from '@app/components/ui/Text/Text';
import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

import { styles } from '../RichChatMessage.styles';

export function SharedChatSourceLabel() {
  return (
    <View style={styles.sharedChatLabelRow}>
      <SymbolView
        name='bubble.left.and.bubble.right.fill'
        size={12}
        tintColor='#ADADB8'
      />
      <Text style={styles.sharedChatLabelText}>Via shared chat</Text>
    </View>
  );
}
