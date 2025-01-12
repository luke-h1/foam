import { Text } from '@app/components/ui/Text';
import { useAppSelector } from '@app/store/hooks';
import { calculateColor } from '@app/store/reducers/chat/util/colors';
import {
  MessagePart,
  MessagePartEmote,
  MessagePartType,
  MessageTypePrivate,
} from '@app/store/reducers/chat/util/messages/types/messages';
import { showCardsSelector } from '@app/store/selectors/cards';
import { openLinkInBrowser } from '@app/utils/openLinkInBrowser';
import { format } from 'date-fns/fp';
import { memo, useState } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Badges from '../Badges/Badges';
import MessageCard from './MessageCard';
import { colors } from '@app/styles';
import Emote from '../Emote/Emote';

interface MessageRootProps {
  isAction: boolean;
  isHistory: boolean;
  isDeleted: boolean;
  isHighlighted: boolean;
  isAltBg: boolean;
  color: string;
}

const getChatMessageBg = ({ isHighlighted, isAltBg }: MessageRootProps) => {
  if (isHighlighted) return 'rgba(255, 0, 0, 0.3)';
  if (isAltBg) return '#1f1925';
  return 'transparent';
};

const renderMessageParts = (
  parts: MessagePart[],
  login: string,
  meLogin?: string,
) => {
  const result: JSX.Element[] = [];

  for (let i = 0; i < parts.length; i += 1) {
    const { content, type } = parts[i];

    switch (type) {
      case MessagePartType.TEXT: {
        result.push(
          <Text
            key={`${i}-${content}`}
            style={{
              color: colors.text,
            }}
          >
            {content}
          </Text>,
        );
        break;
      }

      case MessagePartType.TWITCH_EMOTE:
      case MessagePartType.BTTV_EMOTE:
      case MessagePartType.FFZ_EMOTE:
      case MessagePartType.STV_EMOTE:
      case MessagePartType.EMOJI: {
        result.push(<Emote emote={parts[i] as MessagePartEmote} />);
        break;
      }

      case MessagePartType.MENTION: {
        result.push(<Text>{content.displayText}</Text>);
        break;
      }

      case MessagePartType.LINK: {
        result.push(
          <TouchableOpacity onPress={() => openLinkInBrowser(content.url)}>
            <Text>{content.displayText}</Text>
          </TouchableOpacity>,
        );
        break;
      }

      default:
        console.warn('Unsupported type');
        break;
    }
  }
  return result;
};

interface Props {
  message: MessageTypePrivate;
  isAltBg: boolean;
  onNamePress?: (name: string) => void;
  onNameRightPress?: (name: string) => void;
}

const MESSAGE_DELETED_LABEL = '<message deleted>';

const MessagePrivate = ({
  message: {
    timestamp,
    user: { login, displayName, color },
    parts,
    badges,
    card,
    isAction,
    isHistory,
    isDeleted,
    isHighlighted,
  },
  isAltBg,
  onNamePress = () => {},
  onNameRightPress = () => {},
}: Props) => {
  const [isVisible, toggleVisible] = useState<boolean>(false);
  const showCards = useAppSelector(showCardsSelector);

  const handleNameRightPress = () => {
    onNameRightPress(displayName as string);
  };

  const handleNamePress = () => {
    onNamePress(displayName as string);
  };

  const newColor = color ? calculateColor(color) : '#fff';

  const renderBody = () => {
    if (isDeleted && isVisible) {
      return (
        <Text onPress={() => toggleVisible(true)}>{MESSAGE_DELETED_LABEL}</Text>
      );
    }

    return renderMessageParts(parts, login, 'meLogin');
  };

  return (
    <View
      style={[
        styles.messageRoot,
        {
          color: isAction ? newColor : '#fff',
          opacity: isHistory || isDeleted ? 0.5 : 1,
        },
      ]}
    >
      {/* {timestampFormat !== 'Disable' && ( */}
      <Text style={styles.timestamp}>
        {format('hh:mm a', new Date(timestamp))}
      </Text>
      {/* )} */}
      <Badges badges={badges} />
      <Text
        style={[styles.name, { color: newColor }]}
        onPress={handleNamePress}
        onLongPress={handleNameRightPress}
      >
        {displayName}
      </Text>
      <Text>{isAction ? ' ' : ': '}</Text>
      {renderBody()}
      {(showCards.youtube || showCards.twitch) && card && (
        <MessageCard type={card.type} id={card.id} url={card.url} />
      )}
    </View>
  );
};

export default MessagePrivate;

const styles = StyleSheet.create({
  messageRoot: {
    padding: 5,
    paddingHorizontal: 20,
    lineHeight: 20,
    wordWrap: 'break-word',
  },
  name: {
    fontWeight: 'bold',
  },
  mention: {
    padding: 2,
  },
  activeMention: {
    backgroundColor: '#fafafa',
    color: colors.border,
  },
  selfMention: {
    backgroundColor: '#40404a',
    color: '#fff',
  },
  link: {
    color: '#bf94ff',
    textDecorationLine: 'none',
  },
  timestamp: {
    marginRight: 5,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
