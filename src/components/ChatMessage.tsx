import { memo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
// eslint-disable-next-line import/no-cycle
import { CommonMessage } from './Chat';

interface ChatMessage {
  item: CommonMessage;
}

const ChatMessage = memo(({ item }: ChatMessage) => {
  const { message, user, badges } = item;

  return (
    <View style={styles.chatMessageContainer}>
      <View style={styles.chatMessageBackground}>
        <View style={styles.badgesContainer} />
        <View style={styles.messageContainer}>
          <Text
            style={[
              styles.username,
              {
                color: user.color,
              },
            ]}
          >
            {badges}
            {user.name}:{' '}
          </Text>
          {message}
        </View>
      </View>
    </View>
  );
});
ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    width: Dimensions.get('window').width,
  },
  chatWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
    height: '100%',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    margin: 4,
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  contentContainer: {
    padding: 6,
    flexGrow: 1,
  },
  chatMessageContainer: {
    flexDirection: 'row',
    marginBottom: 5,
    alignContent: 'flex-start',
    textAlignVertical: 'top',
    alignItems: 'flex-start',
    width: '100%',
    padding: 2,
  },
  chatMessageBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 4,
    width: '100%',
  },
  badgesContainer: {
    flexDirection: 'row',
    marginRight: 2,
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  username: {
    fontWeight: 'bold',
    marginRight: 1,
    color: '#000',
  },
  chatMessageContent: {
    color: '#000',
    flex: 1,
  },
});
