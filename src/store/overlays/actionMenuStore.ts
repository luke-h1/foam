import { createOverlayStore } from '@app/store/overlays/createOverlayStore';

export interface ActionMenuAction {
  label: string;
  onPress: () => void;
}

export interface ShowActionMenuOptions {
  title: string;
  actions: ActionMenuAction[];
  cancelLabel: string;
}

const store = createOverlayStore<ShowActionMenuOptions>();

export const getActionMenuState = store.getState;
export const subscribeActionMenu = store.subscribe;
export const presentActionMenu = store.present;
export const dismissActionMenu = store.dismiss;
