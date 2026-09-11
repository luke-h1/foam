import type { FontSource } from 'expo-font';

// Native embeds every family through the expo-font config plugin
// (app.config.ts), so nothing loads at runtime. The `.web.ts` sibling holds
// the real maps.
export const criticalFontMap: Record<string, FontSource> = {};
export const deferredFontMap: Record<string, FontSource> = {};
