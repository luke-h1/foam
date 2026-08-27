import { type Image } from '@app/graphql/generated/gql';

export function pickBestFormat(imgs: Image[]): Image | undefined {
  return (
    imgs.find(img => img.mime === 'image/avif') ??
    imgs.find(img => img.mime === 'image/webp') ??
    imgs[0]
  );
}
