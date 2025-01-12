import { DeepPartial } from '@app/types/util';
import { storage } from '@app/utils/storage';
import merge from 'deepmerge';
import { Options, OPTIONS_INITIAL_STATE } from './options';

export default function getInitialOptions(): Options {
  const cachedOptionsString = storage.getString('options');

  if (!cachedOptionsString) {
    return OPTIONS_INITIAL_STATE;
  }

  let parsedCachedOptions: DeepPartial<Options>;
  try {
    parsedCachedOptions = JSON.parse(
      cachedOptionsString,
    ) as DeepPartial<Options>;
  } catch (error) {
    console.error('Failed to parse cached options:', error);
    return OPTIONS_INITIAL_STATE;
  }

  return merge(OPTIONS_INITIAL_STATE, parsedCachedOptions) as Options;
}
