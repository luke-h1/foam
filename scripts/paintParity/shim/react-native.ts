export const Platform = { OS: 'ios', select: (o: any) => o.ios ?? o.default };
export const AppState = {
  addEventListener: () => ({ remove: () => {} }),
};
export const PixelRatio = { get: () => 3 };
export const StyleSheet = {
  absoluteFill: {},
  flatten: (s: any) => s,
  create: (s: any) => s,
};
export const Image = { resolveAssetSource: (s: any) => ({ uri: s }) };
