import { memo } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
// eslint-disable-next-line import/no-cycle
import { CommonMessage } from './Chat';

interface ChatMessage {
  item: CommonMessage;
}

const ChatMessage = memo(({ item }: ChatMessage) => {
  const { message, user, badges } = item;

  return (
    <View style={$chatMessageContainer}>
      <View style={$chatMessageBackground}>
        <View style={$badgesContainer} />
        <View style={$messageContainer}>
          <Text
            style={[
              $username,
              {
                color: user.color,
              },
            ]}
          >
            {badges}
            {user.name}
          </Text>
          {message}
        </View>
      </View>
    </View>
  );
});
ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;

const $chatMessageContainer: ViewStyle = {
  flexDirection: 'row',
  marginBottom: 5,
  alignContent: 'flex-start',
  alignItems: 'flex-start',
  width: '100%',
  padding: 2,
};

const $chatMessageBackground: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 10,
  borderRadius: 4,
  width: '100%',
};
const $badgesContainer: ViewStyle = {
  flexDirection: 'row',
  marginRight: 2,
};
const $messageContainer: ViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
};
const $username: TextStyle = {
  marginRight: 1,
};
