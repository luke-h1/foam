import { getCachedImageUri } from '@app/utils/image/image-cache';
import { memo, useMemo } from 'react';
import {
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { NitroImage } from 'react-native-nitro-image';

interface ChatInlineImageProps {
  cacheVariant: 'badge' | 'emote';
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  sourceUrl: string;
  style: StyleProp<ImageStyle>;
  testID?: string;
}

function ChatInlineImageComponent({
  cacheVariant,
  containerStyle,
  resizeMode = 'contain',
  sourceUrl,
  style,
  testID,
}: ChatInlineImageProps) {
  const resolvedUrl = useMemo(
    () => getCachedImageUri(sourceUrl, { variant: cacheVariant }) ?? sourceUrl,
    [cacheVariant, sourceUrl],
  );
  const image = useMemo(() => ({ url: resolvedUrl }), [resolvedUrl]);

  const imageElement = (
    <NitroImage
      image={image}
      resizeMode={resizeMode}
      recyclingKey={resolvedUrl}
      style={style}
      testID={testID}
    />
  );

  if (!containerStyle) {
    return imageElement;
  }

  return <View style={containerStyle}>{imageElement}</View>;
}

export const ChatInlineImage = memo(ChatInlineImageComponent);
