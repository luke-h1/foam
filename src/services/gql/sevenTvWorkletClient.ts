import { fetch } from '@app/lib/expoFetch';
import { deriveFromResponseOnWorklet } from '@app/lib/offThreadJson';

/**
 * Runs a 7TV GraphQL query and derives the result from the response on the UI
 * thread via `parse` (a worklet returning only the compact shape the caller
 * needs so the cross-runtime payload stays small).
 */
export async function runCosmeticsQuery<TResult>(
  query: string,
  variables: Record<string, unknown>,
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
