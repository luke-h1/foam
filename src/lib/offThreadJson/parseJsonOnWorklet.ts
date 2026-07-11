import { deriveFromResponseOnWorklet } from '@app/lib/offThreadJson/deriveFromResponseOnWorklet';

/**
 * Parses a full JSON response body on a background worklet thread.
 */
export async function parseJsonOnWorklet<T>(responseText: string): Promise<T> {
  return deriveFromResponseOnWorklet(responseText, text => {
    'worklet';
    return JSON.parse(text) as T;
  });
}
