// Re-export shim over preferenceStore so both import paths share one
// observable - two parallel observables on the same MMKV key desync within a session.
export {
  getPreferences,
  type Preferences,
  preferences$,
  replacePreferences,
} from '@app/store/preferenceStore';
