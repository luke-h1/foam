import { Text } from '@app/components/ui/Text';
import { MessageTypeUserNotice } from '@app/store/reducers/chat/util/messages/types/messages';
import { colors } from '@app/styles';
import { memo } from 'react';

interface Props {
  message: MessageTypeUserNotice;
}

function MessageUserNotice({ message }: Props) {
  return (
    <Text
      style={{
        padding: 5,
        lineHeight: 10,
        wordWrap: 'break-word',
        color: colors.text,
      }}
    >
      {message.systemMessage}
    </Text>
  );
}
export default MessageUserNotice;
