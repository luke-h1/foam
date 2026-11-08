import { SEVEN_TV_CACHE_NAMESPACE, storageService } from '@app/lib/storage';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import {
  COSMETICS_CACHE_TTL_MS,
  MAX_COSMETIC_ENTRIES,
  MAX_PERSISTED_COSMETIC_DEFINITIONS,
} from '../types/cache-limits';

const COSMETICS_DEFINITIONS_KEY = 'sevenTvCosmeticDefinitions_v1';
const COSMETICS_BINDINGS_KEY = 'sevenTvCosmeticBindings_v1';
const LEGACY_COSMETICS_SNAPSHOT_KEY = 'sevenTvCosmeticsSnapshot_v1';

export interface CosmeticDefinitionsSnapshot {
  paints: Record<string, PaintData>;
  badges: Record<string, SanitisedBadgeSet>;
}

export interface CosmeticBindingsSnapshot {
  userPaintIds: Record<string, string>;
  userBadgeIds: Record<string, string>;
}

export type CosmeticsSnapshot = CosmeticDefinitionsSnapshot &
  CosmeticBindingsSnapshot;

function capRecord<T>(
  record: Record<string, T>,
  max: number,
): Record<string, T> {
  const entries = Object.entries(record);

  if (entries.length <= max) {
    return record;
  }

  return Object.fromEntries(entries.slice(entries.length - max));
}

export function loadPersistedCosmetics(): CosmeticsSnapshot | null {
  try {
    const definitions = storageService.getString<CosmeticDefinitionsSnapshot>(
      COSMETICS_DEFINITIONS_KEY,
      SEVEN_TV_CACHE_NAMESPACE,
    );

    const bindings = storageService.getString<CosmeticBindingsSnapshot>(
      COSMETICS_BINDINGS_KEY,
      SEVEN_TV_CACHE_NAMESPACE,
    );

    const legacy =
      definitions && bindings
        ? null
        : storageService.getString<CosmeticsSnapshot>(
            LEGACY_COSMETICS_SNAPSHOT_KEY,
            SEVEN_TV_CACHE_NAMESPACE,
          );

    if (!definitions && !bindings && !legacy) {
      return null;
    }

    return {
      paints: definitions?.paints ?? legacy?.paints ?? {},
      badges: definitions?.badges ?? legacy?.badges ?? {},
      userPaintIds: bindings?.userPaintIds ?? legacy?.userPaintIds ?? {},
      userBadgeIds: bindings?.userBadgeIds ?? legacy?.userBadgeIds ?? {},
    };
  } catch {
    return null;
  }
}

export function writePersistedCosmeticDefinitions(
  snapshot: CosmeticDefinitionsSnapshot,
): void {
  try {
    const capped: CosmeticDefinitionsSnapshot = {
      paints: capRecord(snapshot.paints, MAX_PERSISTED_COSMETIC_DEFINITIONS),
      badges: capRecord(snapshot.badges, MAX_PERSISTED_COSMETIC_DEFINITIONS),
    };
    storageService.set(
      COSMETICS_DEFINITIONS_KEY,
      capped,
      SEVEN_TV_CACHE_NAMESPACE,
      {
        expiry: new Date(Date.now() + COSMETICS_CACHE_TTL_MS),
      },
    );
  } catch {
    // Ignore
  }
}

export function writePersistedCosmeticBindings(
  snapshot: CosmeticBindingsSnapshot,
): void {
  try {
    const capped: CosmeticBindingsSnapshot = {
      userPaintIds: capRecord(snapshot.userPaintIds, MAX_COSMETIC_ENTRIES),
      userBadgeIds: capRecord(snapshot.userBadgeIds, MAX_COSMETIC_ENTRIES),
    };

    storageService.set(
      COSMETICS_BINDINGS_KEY,
      capped,
      SEVEN_TV_CACHE_NAMESPACE,
      {
        expiry: new Date(Date.now() + COSMETICS_CACHE_TTL_MS),
      },
    );
  } catch {
    // Ignore
  }
}
