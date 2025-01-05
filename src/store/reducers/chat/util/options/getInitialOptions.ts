import { DeepPartial } from '@app/types/util';
import { storage } from '@app/utils/storage';
import merge from 'deepmerge';
import { Options, OPTIONS_INITIAL_STATE } from './options';

export default function getInitialOptions(): Options {
  const cachedOptions = storage.getString('options') as DeepPartial<Options>;

  if (!cachedOptions) {
    return OPTIONS_INITIAL_STATE;
  }
  return merge(OPTIONS_INITIAL_STATE, cachedOptions) as Options;
}
