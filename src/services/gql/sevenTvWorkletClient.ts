import { deriveFromResponseOnWorklet } from '@app/lib/offThreadJson/deriveFromResponseOnWorklet';
import type { JsonValue } from '@app/utils/object/deepEqualJson';

/**
 * Runs a 7TV GraphQL query and parses the response off the JS thread; `parse`
 * is a worklet returning only a compact shape so the cross-runtime payload stays small.
 */
export async function runCosmeticsQuery<TResult>(
  query: string,
  variables: Record<string, JsonValue>,
  parse: (responseText: string) => TResult,
): Promise<{ result?: TResult; error?: Error }> {
  try {
    const response = await fetch('https://7tv.io/v4/gql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) {
      return {
        error: new Error(`7TV GQL request failed: HTTP ${response.status}`),
      };
    }
    return {
      result: await deriveFromResponseOnWorklet(await response.text(), parse),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
