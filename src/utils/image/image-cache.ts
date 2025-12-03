import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Directory, File, Paths } from 'expo-file-system/next';

export const BLURHASH = 'LBDbA}oL00Na~B9u57={XRay-Uj[';

/**
 * Image cache utility for storing generated images to disk
 * instead of keeping large base64 strings in memory
 */

const SESSION_CACHE_DIR = 'chat-img-cache';

/**
 * Generate a simple hash from a string (for consistent caching)
 * Uses a simple hash function since we don't need cryptographic security
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + char;
    // eslint-disable-next-line no-bitwise
    hash &= hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
}

/**
 * Get file extension from URL or default to 'jpg'
 */
function getFileExtensionFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const urlPath = urlObj.pathname;
    const match = urlPath.match(/\.(png|jpg|jpeg|gif|webp|svg)/i);
    if (match && match[1]) {
      const ext = match[1].toLowerCase();
      // Normalize jpeg to jpg
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  } catch {
    // Invalid URL, fall through to default
  }
  return 'jpg';
}

/**
 * Generate a consistent filename from a URL
 */
function getCachedFileName(url: string): string {
  const hash = hashString(url);
  const ext = getFileExtensionFromUrl(url);
  return `${hash}.${ext}`;
}

/**
 * Ensure the cache directory exists using legacy API to avoid native bridge issues
 */
async function ensureCacheDirectoryAsync(): Promise<Directory> {
  const cacheDir = new Directory(Paths.cache, SESSION_CACHE_DIR);
  if (!cacheDir.exists) {
    await FileSystemLegacy.makeDirectoryAsync(cacheDir.uri, {
      intermediates: true,
    });
  }
  return cacheDir;
}

/**
 * Synchronous version - assumes directory already exists or will be created
 */
function ensureCacheDirectory(): Directory {
  return new Directory(Paths.cache, SESSION_CACHE_DIR);
}

/**
 * Save a base64 image to the file system and return the file URI
 * This significantly reduces memory usage by storing images on disk
 * instead of keeping large base64 strings in React state
 */
export function cacheBase64Image(
  base64: string,
  ext: 'png' | 'jpg' = 'png',
): string {
  const cacheDir = ensureCacheDirectory();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${ext}`;
  const file = new File(cacheDir, fileName);

  // Write base64 string directly to file
  // The File.write method accepts a string when writing base64 data
  file.write(base64);

  return file.uri;
}

/**
 * Download an image from a URL directly to disk (optimized - uses native download)
 * Uses URL hashing for consistent caching - same URL will always map to same file
 * Checks if file already exists before downloading to avoid redundant downloads
 *
 * @param url - The image URL (e.g., from S3)
 * @returns The file URI where the image was cached
 */
export async function cacheImageFromUrl(url: string): Promise<string> {
  const cacheDir = await ensureCacheDirectoryAsync();
  const fileName = getCachedFileName(url);
  const cachedFile = new File(cacheDir, fileName);

  // Check if file already exists in cache
  if (cachedFile.exists) {
    return cachedFile.uri;
  }

  try {
    // Download the file
    const downloadedFile = await File.downloadFileAsync(url, cacheDir);

    // If the downloaded file has a different name, rename it to our consistent hash-based name
    if (downloadedFile.uri !== cachedFile.uri) {
      // Re-check if cached file exists (race condition from parallel downloads)
      if (cachedFile.exists) {
        // Another download already created the file, delete the temp and return cached
        try {
          downloadedFile.delete();
        } catch {
          // Ignore delete errors
        }
        return cachedFile.uri;
      }

      try {
        downloadedFile.move(cachedFile);
        return cachedFile.uri;
      } catch {
        // If move fails, check if cached file now exists (race condition)
        if (cachedFile.exists) {
          try {
            downloadedFile.delete();
          } catch {
            // Ignore delete errors
          }
          return cachedFile.uri;
        }
        // Otherwise return the downloaded file URI
        return downloadedFile.uri;
      }
    }

    return downloadedFile.uri;
  } catch {
    // If any error occurs but cached file now exists (race condition), return it
    if (cachedFile.exists) {
      return cachedFile.uri;
    }
    // Fallback to original URL - don't throw, just return the URL
    // The image will still load from network
    return url;
  }
}

/**
 * Check if an image URL is already cached
 * @param url - The image URL to check
 * @returns The cached file URI if it exists, null otherwise
 */
export function getCachedImageUri(url: string): string | null {
  try {
    const cacheDir = ensureCacheDirectory();
    const fileName = getCachedFileName(url);
    const cachedFile = new File(cacheDir, fileName);

    if (cachedFile.exists) {
      return cachedFile.uri;
    }
  } catch {
    // If directory doesn't exist or other error, return null
  }
  return null;
}

/**
 * Read a cached image as base64 (useful for sharing/saving operations)
 * This allows us to store file URIs in state but still access base64 when needed
 */
export function getCachedImageAsBase64(fileUri: string): string {
  const file = new File(fileUri);
  const base64 = file.base64() ?? '';
  return `data:image/png;base64,${base64}`;
}

/**
 * Delete a cached image file by URL
 */
export function deleteCachedImageByUrl(url: string): void {
  try {
    const cacheDir = ensureCacheDirectory();
    const fileName = getCachedFileName(url);
    const file = new File(cacheDir, fileName);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.error('Error deleting cached image:', error);
  }
}

/**
 * Delete a cached image file by URI
 */
export function deleteCachedImage(fileUri: string): void {
  try {
    const file = new File(fileUri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.error('Error deleting cached image:', error);
  }
}

/**
 * Clear all cached images from the session directory
 * Call this when resetting the playground session
 */
export function clearSessionCache(): void {
  try {
    const cacheDir = new Directory(Paths.cache, SESSION_CACHE_DIR);
    if (cacheDir.exists) {
      cacheDir.delete();
    }
  } catch (error) {
    console.error('Error clearing session cache:', error);
  }
}

export interface CachedImageInfo {
  uri: string;
  name: string;
  size: number;
}

/**
 * List all cached images in the session cache directory
 * @returns Array of cached image info objects
 */
export function listCachedImages(): CachedImageInfo[] {
  try {
    const cacheDir = new Directory(Paths.cache, SESSION_CACHE_DIR);
    if (!cacheDir.exists) {
      return [];
    }

    const items = cacheDir.list();
    return items
      .filter((item): item is File => item instanceof File)
      .map(file => ({
        uri: file.uri,
        name: file.uri.split('/').pop() ?? 'unknown',
        size: file.size ?? 0,
      }));
  } catch (error) {
    console.error('Error listing cached images:', error);
    return [];
  }
}

/**
 * Get the cache directory path
 */
export function getCacheDirectoryPath(): string {
  const cacheDir = new Directory(Paths.cache, SESSION_CACHE_DIR);
  return cacheDir.uri;
}
