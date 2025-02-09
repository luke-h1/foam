import { Image as ExpoImage, ImageProps } from 'expo-image';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export function BlurImage({
  placeholder = blurhash,
  contentFit = 'cover',
  ...props
}: ImageProps) {
  return (
    <ExpoImage contentFit={contentFit} placeholder={placeholder} {...props} />
  );
}
