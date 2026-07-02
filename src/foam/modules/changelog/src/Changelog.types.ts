import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type ChangelogModuleEvents = Record<string, never>;

export type ChangelogMediaKind = 'image' | 'video';

export type ChangelogListRow = {
  symbolSystemName: string;
  title: string;
  description: string;
};

export type ChangelogListItem = {
  type: 'list';
  title: string;
  rows: ChangelogListRow[];
};

export type ChangelogMediaItem = {
  type: 'media';
  mediaKind: ChangelogMediaKind;
  url: string;
  title: string;
  description: string;
};

export type ChangelogVersionItem = ChangelogListItem | ChangelogMediaItem;

export type ChangelogVersionNotes = {
  version: string;
  items: ChangelogVersionItem[];
};

export type ChangelogConfiguration = {
  nextButtonLabel?: string;
  doneButtonLabel?: string;
  accentColorHex?: string;
};

export type ChangelogPresentOptions = {
  notes: ChangelogVersionNotes[];
  version?: string;
  otaVersion?: string;
  configuration?: ChangelogConfiguration;
};

export type ChangelogNativeModule = {
  getCurrentAppVersion(): string;
  getLatestSeenAppVersion(): string | null;
  getLatestSeenOTAVersion(): string | null;
  present(options: ChangelogPresentOptions): Promise<void>;
  resetSeenVersions(): void;
};

export type ChangelogViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
