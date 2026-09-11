import type { FontSource } from 'expo-font';

// Native embeds the fonts through the expo-font plugin; only web loads them
// at runtime (see the `.web.ts` sibling).
export const criticalFontMap: Record<string, FontSource> = {};
export const deferredFontMap: Record<string, FontSource> = {};
