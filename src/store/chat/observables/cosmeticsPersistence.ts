import { storageService } from '@app/lib/storage';

import type { PaintData, SanitisedBadgeSet } from '../types/constants';

// Definitions (paints/badges — large objects, rarely change once the
// equal-content guards are past) and bindings (user→cosmetic id pairs — tiny,
// change per newly sighted chatter) are persisted under separate keys so the
// frequent binding syncs stop re-serializing up to 750 full paint definitions
// every debounce window.
const COSMETICS_DEFINITIONS_KEY = 'sevenTvCosmeticDefinitions_v1';
const COSMETICS_BINDINGS_KEY = 'sevenTvCosmeticBindings_v1';
const LEGACY_COSMETICS_SNAPSHOT_KEY = 'sevenTvCosmeticsSnapshot_v1';
const COSMETICS_NAMESPACE = 'seven_tv_cache';
const SNAPSHOT_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_PERSISTED_PAINTS = 750;
const MAX_PERSISTED_BADGES = 750;
const MAX_PERSISTED_ENTITLEMENTS = 500;

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
      COSMETICS_NAMESPACE,
    );
    const bindings = storageService.getString<CosmeticBindingsSnapshot>(
      COSMETICS_BINDINGS_KEY,
      COSMETICS_NAMESPACE,
    );
    if (definitions || bindings) {
      return {
        paints: definitions?.paints ?? {},
        badges: definitions?.badges ?? {},
        userPaintIds: bindings?.userPaintIds ?? {},
        userBadgeIds: bindings?.userBadgeIds ?? {},
      };
    }

    // Pre-split installs persisted one combined snapshot; read it once as a
    // migration path — the next persist writes the split keys.
    const legacy = storageService.getString<CosmeticsSnapshot>(
      LEGACY_COSMETICS_SNAPSHOT_KEY,
      COSMETICS_NAMESPACE,
    );
    if (!legacy) {
      return null;
    }
    return {
      paints: legacy.paints ?? {},
      badges: legacy.badges ?? {},
      userPaintIds: legacy.userPaintIds ?? {},
      userBadgeIds: legacy.userBadgeIds ?? {},
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
      paints: capRecord(snapshot.paints, MAX_PERSISTED_PAINTS),
      badges: capRecord(snapshot.badges, MAX_PERSISTED_BADGES),
    };
    storageService.set(COSMETICS_DEFINITIONS_KEY, capped, COSMETICS_NAMESPACE, {
      expiry: new Date(Date.now() + SNAPSHOT_TTL_MS),
    });
  } catch {
    // Persistence is best-effort; never let a cache write break cosmetics.
  }
}

export function writePersistedCosmeticBindings(
  snapshot: CosmeticBindingsSnapshot,
): void {
  try {
    const capped: CosmeticBindingsSnapshot = {
      userPaintIds: capRecord(
        snapshot.userPaintIds,
        MAX_PERSISTED_ENTITLEMENTS,
      ),
      userBadgeIds: capRecord(
        snapshot.userBadgeIds,
        MAX_PERSISTED_ENTITLEMENTS,
      ),
    };
    storageService.set(COSMETICS_BINDINGS_KEY, capped, COSMETICS_NAMESPACE, {
      expiry: new Date(Date.now() + SNAPSHOT_TTL_MS),
    });
  } catch {
    // Persistence is best-effort; never let a cache write break cosmetics.
  }
}
