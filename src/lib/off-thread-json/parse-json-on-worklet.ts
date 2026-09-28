import { deriveFromResponseOnWorklet } from '@app/lib/off-thread-json/derive-from-response-on-worklet';

/**
 * Parses a full JSON response body on a background worklet thread.
 */
export async function parseJsonOnWorklet<T>(responseText: string): Promise<T> {
  return deriveFromResponseOnWorklet(responseText, text => {
    'worklet';
    // SAFETY: T is the response contract declared by the caller; this worklet only decodes the body.
    return JSON.parse(text) as T;
  });
}
