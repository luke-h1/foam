// Single source of truth lives in preferenceStore; this module re-exports it
// so both import paths share one observable. Two parallel observables
// persisted to the same MMKV key desync within a session (writes through one
// are invisible to the other until relaunch).
export {
  getPreferences,
  type Preferences,
  preferences$,
  replacePreferences,
} from '@app/store/preferenceStore';
