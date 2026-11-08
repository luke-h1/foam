import { type Image } from '@app/graphql/generated/gql';
import { SEVEN_TV_STATIC_FORMATS } from '@app/utils/seven-tv/constants';
import { pickFirstFormat } from '@app/utils/seven-tv/gql/pickFirstFormat';

export function pickBestFormat(imgs: Image[]): Image | undefined {
  'worklet';

  return pickFirstFormat(imgs, SEVEN_TV_STATIC_FORMATS);
}
