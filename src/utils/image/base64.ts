import { Asset } from 'expo-asset';
import { File } from 'expo-file-system/next';

/**
 * Strip data URL prefix if present
 * @example "data:image/png;base64,iVBORw..." -> "iVBORw..."
 */
export function stripDataUrlPrefix(b64: string): string {
  const i = b64.indexOf('base64,');
  return i !== -1 ? b64.slice(i + 'base64,'.length) : b64;
}

/**
 * Convert base64 string to Uint8Array (minimal implementation, no external deps)
 * Handles both raw base64 and data URLs (with automatic prefix stripping)
 */
export function base64ToBytes(b64: string): Uint8Array {
  b64 = stripDataUrlPrefix(b64).replace(/\s/g, '');
  const table =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const len = b64.length;

  // compute output length
  let padding = 0;
  if (len >= 2 && b64[len - 1] === '=') padding += 1;
  if (len >= 2 && b64[len - 2] === '=') padding += 1;
  const outLen = (len / 4) * 3 - padding;

  const bytes = new Uint8Array(outLen);
  let byteIdx = 0;

  const sextet = (c: string) => (c === '=' ? 0 : table.indexOf(c));

  for (let i = 0; i < len; i += 4) {
    const c1 = sextet(b64[i] ?? '');
    const c2 = sextet(b64[i + 1] ?? '');
    const c3 = sextet(b64[i + 2] ?? '');
    const c4 = sextet(b64[i + 3] ?? '');

    // eslint-disable-next-line no-bitwise
    const triple = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;

    // eslint-disable-next-line no-bitwise
    if (byteIdx < outLen) bytes[(byteIdx += 1)] = (triple >> 16) & 0xff;
    // eslint-disable-next-line no-bitwise
    if (byteIdx < outLen) bytes[(byteIdx += 1)] = (triple >> 8) & 0xff;
    // eslint-disable-next-line no-bitwise
    if (byteIdx < outLen) bytes[(byteIdx += 1)] = triple & 0xff;
  }
  return bytes;
}

/**
 * Convert a bundled static asset (require("../assets/img.png")) into Base64.
 * This is only needed for static assets, not for images from the gallery.
 */
export async function assetToBase64(moduleId: number): Promise<string> {
  // 1. Resolve the static asset
  const [asset] = await Asset.loadAsync(moduleId);
  const uri = asset?.localUri ?? asset?.uri;
  if (!uri) throw new Error('Unable to resolve asset URI');

  // 2. Read as Base64 using FileSystem
  const file = new File(uri);
  const base64 = file.base64();
  return base64;
}

/**
 * Convert URL image to Base64
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64 ?? '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to convert URL to base64: ${error}`);
  }
}
