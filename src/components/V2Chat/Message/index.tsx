import {
  Messages,
  MessageType,
} from '@app/store/reducers/chat/util/messages/types/messages';
import MessageNotice from './MessageNotice';
import MessagePrivate from './MessagePrivate';
import MessageUserNotice from './MessageUserNotice';

interface Props {
  message: Messages;
  isAltBg: boolean;
  onNamePress?: (name: string) => void;
  onNameRightPress?: (name: string) => void;
}

const assertNever = (value: never): never => value;

export default function Message({
  isAltBg,
  message,
  onNamePress,
  onNameRightPress,
}: Props) {
  switch (message.type) {
    case MessageType.PRIVATE_MESSAGE: {
      return (
        <MessagePrivate
          message={message}
          isAltBg={isAltBg}
          onNamePress={onNamePress}
          onNameRightPress={onNameRightPress}
        />
      );
    }

    case MessageType.USER_NOTICE: {
      return <MessageUserNotice message={message} />;
    }

    case MessageType.NOTICE: {
      return <MessageNotice isAltBg={isAltBg} message={message} />;
    }

    default:
      return assertNever(message);
  }
}
