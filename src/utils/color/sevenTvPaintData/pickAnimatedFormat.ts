import { type Image } from '@app/graphql/generated/gql';

export function pickAnimatedFormat(imgs: Image[]): Image | undefined {
  return (
    imgs.find(img => img.mime === 'image/webp') ??
    imgs.find(img => img.mime === 'image/gif') ??
    imgs.find(img => img.mime === 'image/avif') ??
    imgs[0]
  );
}
