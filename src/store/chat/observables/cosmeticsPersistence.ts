import { storageService } from '@app/lib/storage';

import type { PaintData, SanitisedBadgeSet } from '../types/constants';

const COSMETICS_SNAPSHOT_KEY = 'sevenTvCosmeticsSnapshot_v1';
const COSMETICS_NAMESPACE = 'seven_tv_cache';
const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PERSISTED_PAINTS = 750;
const MAX_PERSISTED_BADGES = 750;
const MAX_PERSISTED_ENTITLEMENTS = 500;

export interface CosmeticsSnapshot {
  paints: Record<string, PaintData>;
  badges: Record<string, SanitisedBadgeSet>;
  userPaintIds: Record<string, string>;
  userBadgeIds: Record<string, string>;
}

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
    const snapshot = storageService.getString<CosmeticsSnapshot>(
      COSMETICS_SNAPSHOT_KEY,
      COSMETICS_NAMESPACE,
    );
    if (!snapshot) {
      return null;
    }
    return {
      paints: snapshot.paints ?? {},
      badges: snapshot.badges ?? {},
      userPaintIds: snapshot.userPaintIds ?? {},
      userBadgeIds: snapshot.userBadgeIds ?? {},
    };
  } catch {
    return null;
  }
}

export function writePersistedCosmetics(snapshot: CosmeticsSnapshot): void {
  try {
    const capped: CosmeticsSnapshot = {
      paints: capRecord(snapshot.paints, MAX_PERSISTED_PAINTS),
      badges: capRecord(snapshot.badges, MAX_PERSISTED_BADGES),
      userPaintIds: capRecord(
        snapshot.userPaintIds,
        MAX_PERSISTED_ENTITLEMENTS,
      ),
      userBadgeIds: capRecord(
        snapshot.userBadgeIds,
        MAX_PERSISTED_ENTITLEMENTS,
      ),
    };
    storageService.set(COSMETICS_SNAPSHOT_KEY, capped, COSMETICS_NAMESPACE, {
      expiry: new Date(Date.now() + SNAPSHOT_TTL_MS),
    });
  } catch {
    // Persistence is best-effort; never let a cache write break cosmetics.
  }
}
