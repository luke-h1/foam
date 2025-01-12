import { useAppSelector } from '@app/store/hooks';
import { HtmlEmote } from '@app/store/reducers/chat/types/emote';
import createHtmlEmote from '@app/store/reducers/chat/util/createHtmlEmote';
import {
  MessagePartEmote,
  MessagePartType,
} from '@app/store/reducers/chat/util/messages/types/messages';
import { emotesSelector } from '@app/store/selectors/emote';
import { Image, StyleSheet, View } from 'react-native';

const SmartEmote = ({ title, alt, src, srcSet, sources }: HtmlEmote) => {
  return (
    <View>
      {sources.length === 0 ? (
        <Image style={styles.image} source={{ uri: src }} alt={alt} />
      ) : (
        <View>
          {sources.map(([mimeType, sourceSrcSet], index) => (
            <Image
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              style={styles.image}
              source={{ uri: sourceSrcSet }}
              alt={alt}
            />
          ))}
          <Image style={styles.image} source={{ uri: src }} alt={alt} />
        </View>
      )}
    </View>
  );
};

const Emoji = ({ title, alt, src, srcSet }: HtmlEmote) => {
  return (
    <Image
      style={styles.imageEmoji}
      source={{
        uri: src,
      }}
      testID={title}
      srcSet={srcSet}
      alt={alt}
    />
  );
};

interface Props {
  emote: MessagePartEmote;
}

export default function Emote({ emote: { type, content } }: Props) {
  const emotes = useAppSelector(emotesSelector);
  const htmlEmote = createHtmlEmote(emotes, type, content.id);

  if (!htmlEmote) {
    return null;
  }

  const renderModifiers = () => {
    return content.modifiers
      .map(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        emote => createHtmlEmote(emotes, emote.type, emote.content.id)!,
      )
      .filter(Boolean)
      .map((htmlEmoteModifier, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <View key={index} style={styles.modifier}>
          <SmartEmote {...htmlEmoteModifier} />
        </View>
      ));
  };

  return (
    <View
      style={[
        styles.wrapper,
        content.modifiers.length > 0 && styles.modifiedWrapper,
      ]}
      id={htmlEmote.id}
    >
      {type === MessagePartType.EMOJI ? (
        <Emoji {...htmlEmote} />
      ) : (
        <SmartEmote {...htmlEmote} />
      )}
      {!!content.modifiers.length && renderModifiers()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    display: 'flex',
  },
  modifiedWrapper: {
    position: 'relative',
    zIndex: 1,
  },
  modifier: {
    position: 'relative',
    zIndex: 0,
  },
  image: {
    position: 'relative',
    marginVertical: -5,
    maxWidth: '100%',
    resizeMode: 'contain',
  },
  imageEmoji: {
    position: 'relative',
    marginVertical: -5,
    maxWidth: '100%',
    resizeMode: 'contain',
    width: 19.5,
    height: 19.5,
  },
});
