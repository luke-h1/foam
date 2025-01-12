import { useAppSelector } from '@app/store/hooks';
import { Messages } from '@app/store/reducers/chat/util/messages/types/messages';
import { currentChannelMessagesSelector } from '@app/store/selectors/chat';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useRef } from 'react';
import { Dimensions, View, ViewStyle } from 'react-native';
import Message from '../Message';

interface Props {
  onNamePress?: (name: string) => void;
  onNameRightPress?: (name: string) => void;
}

const ChatMessages = ({ onNamePress, onNameRightPress }: Props) => {
  const messages = useAppSelector(currentChannelMessagesSelector);
  const flashListRef = useRef<FlashList<Messages>>(null);

  return (
    <View style={{ height: 1200, width: Dimensions.get('screen').width }}>
      <FlashList
        data={messages}
        ref={flashListRef}
        estimatedItemSize={100}
        scrollEnabled
        pagingEnabled
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flashListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <Message
            key={item.id}
            message={item}
            isAltBg={false}
            onNamePress={onNamePress}
            onNameRightPress={onNameRightPress}
          />
        )}
      />
    </View>
  );
};

export default memo(ChatMessages);
