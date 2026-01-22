/**
 * Returns the common list of update channels.
 * 
 * @returns Array of common channel names
 */
export function fetchUpdateChannels(): string[] {
  return ['production', 'preview', 'staging', 'development', 'local'];
}
