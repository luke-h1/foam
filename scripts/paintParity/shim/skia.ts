import { JsiSkApi } from '@shopify/react-native-skia/lib/commonjs/skia/web';

export const Skia: any = JsiSkApi((globalThis as any).CanvasKit);

export {
  AlphaType,
  BlendMode,
  ClipOp,
  ColorType,
  FilterMode,
  FontWeight,
  ImageFormat,
  MipmapMode,
  PaintStyle,
  TileMode,
} from '@shopify/react-native-skia/lib/commonjs/skia/types';
