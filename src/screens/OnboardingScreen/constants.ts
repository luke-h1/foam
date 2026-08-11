/**
 * Lives apart from the screen so the entry route can read the flag without
 * importing the onboarding subtree - the screen pulls EnergyOrb and with it
 * the whole Skia runtime, which every launch paid at import time just to
 * check a boolean.
 */
export const ONBOARDING_SEEN_KEY = 'V1_hasSeenOnboarding';
