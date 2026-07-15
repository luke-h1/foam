import { createAwaitableOverlayStore } from '@app/utils/overlayStore';

export type MediaPermissionPrompt = {
  title: string;
  message: string;
  cancelLabel: string;
  settingsLabel: string;
};

const store = createAwaitableOverlayStore<MediaPermissionPrompt>();

export const getMediaPermissionState = store.getState;
export const subscribeMediaPermission = store.subscribe;
export const presentMediaPermissionPrompt = store.present;
export const resolveMediaPermissionPrompt = store.dismiss;
