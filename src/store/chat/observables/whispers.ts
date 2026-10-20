import { observable } from "@legendapp/state";
import { WhisperThread } from "../types/whispers";

/**
 * Whisper threads keyed by the login.
 */
export const whisperThreads$ = observable<Record<string, WhisperThread>>({});
