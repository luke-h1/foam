// console.log(!!global.__turboModuleProxy)

/**
 * tvOS doesn't support image manipulation, so we just return the original photo URI.
 */

export const calculateNewCachePhoto = (photoUri: string) => {
  return {
    uri: photoUri,
  };
};
