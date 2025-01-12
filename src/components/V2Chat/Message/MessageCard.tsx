import Image from '@app/components/Image';
import { Text } from '@app/components/ui/Text';
import {
  useTwitchClipQuery,
  useTwitchVideoQuery,
} from '@app/store/query/twitch';
import {
  MessageCard as _MessageCardType,
  MessageCardType,
} from '@app/store/reducers/chat/util/messages/types/messages';
import { openLinkInBrowser } from '@app/utils/openLinkInBrowser';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = _MessageCardType;

const errorImageSrc = 'path/to/errorImage.png';
const errorTitle = 'Error';
const errorDescription: Record<MessageCardType, string> = {
  [MessageCardType.TWITCH_CLIP]: 'Failed to load Twitch Clip.',
  [MessageCardType.TWITCH_VIDEO]: 'Failed to load Twitch Video.',
  // Add other message card types if needed
};

const RenderError = ({ type }: { type: MessageCardType }) => (
  <View style={styles.cardRoot}>
    <View style={styles.preview}>
      <Image source={{ uri: errorImageSrc }} style={styles.image} />
    </View>
    <View style={styles.content}>
      <Text>{errorTitle}</Text>
      <Text>{errorDescription[type]}</Text>
    </View>
  </View>
);

const RenderLoading = () => (
  <View style={styles.cardRoot}>
    <ActivityIndicator size="large" color="#0000ff" />
    <View style={styles.content}>
      <View style={styles.titleLoading} />
      <View style={styles.descriptionLoading} />
    </View>
  </View>
);

const hooks: Record<
  MessageCardType,
  typeof useTwitchClipQuery | typeof useTwitchVideoQuery
> = {
  [MessageCardType.TWITCH_CLIP]: useTwitchClipQuery,
  [MessageCardType.TWITCH_VIDEO]: useTwitchVideoQuery,
};

export default function MessageCard({
  id,
  type = MessageCardType.TWITCH_CLIP,
  url,
}: Props) {
  const hook = hooks[type];
  const isTwitch =
    type === MessageCardType.TWITCH_CLIP ||
    type === MessageCardType.TWITCH_VIDEO;

  const card = hook(id, { skip: !id });

  if (card.isUninitialized) {
    return null;
  }

  if (card.isLoading) {
    return <RenderLoading />;
  }

  if (card.isError) {
    return <RenderError type={type} />;
  }

  if (!card.data) {
    return null;
  }

  const { description, src, srcSet, title } = card.data;

  const href =
    type === MessageCardType.TWITCH_CLIP
      ? `https://clips.twitch.tv/${id}`
      : url;

  const handlePress = () => openLinkInBrowser(href);

  return (
    <TouchableOpacity style={styles.cardRoot} onPress={handlePress}>
      <View style={styles.preview}>
        <Image source={{ uri: src }} style={styles.image} />
      </View>
      <View style={styles.content}>
        <Text>{title}</Text>
        <Text>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 100,
    height: 100,
  },
  cardRoot: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 10,
  },
  content: {
    marginTop: 10,
  },
  titleLoading: {
    height: 20,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
    borderRadius: 5,
  },
  descriptionLoading: {
    height: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
});
