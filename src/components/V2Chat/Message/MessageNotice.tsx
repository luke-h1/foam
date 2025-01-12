import { Text } from '@app/components/ui/Text';
import { MessageTypeNotice } from '@app/store/reducers/chat/util/messages/types/messages';
import { colors } from '@app/styles';
import { memo } from 'react';
import { View } from 'react-native';

interface Props {
  message: MessageTypeNotice;
  isAltBg?: boolean;
}

function MessageNotice({ message, isAltBg }: Props) {
  return (
    <View
      style={{
        backgroundColor: isAltBg ? '#1f1925' : 'transparent',
        padding: 5,
      }}
    >
      <Text
        style={{
          lineHeight: 3,
          wordWrap: 'break-word',
          color: colors.textDim,
        }}
      >
        {message.body}
      </Text>
    </View>
  );
}
export default memo(MessageNotice);
