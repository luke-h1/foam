import { RefObject } from 'react';
import { appendQueryParams, parseSocketIOUrl } from './socket-io';
import { Options } from './types';

export async function getUrl(
  url: string | (() => string | Promise<string>),
  optionsRef: RefObject<Options>,
) {
  let convertedUrl: string;

  if (typeof url === 'function') {
    convertedUrl = await url();
  } else {
    convertedUrl = url;
  }

  const parsedUrl = optionsRef.current.fromSocketIO
    ? parseSocketIOUrl(convertedUrl)
    : convertedUrl;

  const parsedWithQueryParams = optionsRef.current.queryParams
    ? appendQueryParams(
        parsedUrl,
        optionsRef.current.queryParams,
        optionsRef.current.fromSocketIO,
      )
    : parsedUrl;

  return parsedWithQueryParams;
}
