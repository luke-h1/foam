declare module '@modules/core-haptics' {
  export interface HapticEventParameter {
    parameterID: 'hapticIntensity' | 'hapticSharpness';
    value: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;
  }

  export interface HapticPatternData {
    events: {
      eventType: 'hapticTransient' | 'hapticContinuous';
      time?: number;
      eventDuration?: number;
      parameters?: HapticEventParameter[];
    }[];
  }

  export interface NativeCoreHapticsModule {
    impact(sharpness: number, intensity: number): Promise<void>;
    playPattern(pattern: HapticPatternData): Promise<void>;
  }

  const module: NativeCoreHapticsModule;
  export default module;
}

declare module '@modules/icloud-sync' {
  export interface ICloudSyncNativeModule {
    getString(key: string): Promise<string | null>;
    isAvailable(): boolean;
    remove(key: string): Promise<void>;
    setString(key: string, value: string): Promise<void>;
    synchronize(): Promise<boolean>;
  }

  const module: ICloudSyncNativeModule;
  export default module;
}

declare module '@modules/changelog' {
  export type ChangelogMediaKind = 'image' | 'video';

  export interface ChangelogListRow {
    symbolSystemName: string;
    title: string;
    description: string;
  }

  export interface ChangelogListItem {
    type: 'list';
    title: string;
    rows: ChangelogListRow[];
  }

  export interface ChangelogMediaItem {
    type: 'media';
    mediaKind: ChangelogMediaKind;
    url: string;
    title: string;
    description: string;
  }

  export type ChangelogVersionItem = ChangelogListItem | ChangelogMediaItem;

  export interface ChangelogVersionNotes {
    version: string;
    items: ChangelogVersionItem[];
  }

  export interface ChangelogConfiguration {
    nextButtonLabel?: string;
    doneButtonLabel?: string;
    accentColorHex?: string;
  }

  export interface ChangelogPresentOptions {
    notes: ChangelogVersionNotes[];
    version?: string;
    otaVersion?: string;
    configuration?: ChangelogConfiguration;
  }

  export interface ChangelogNativeModule {
    getCurrentAppVersion(): string;
    getLatestSeenAppVersion(): string | null;
    getLatestSeenOTAVersion(): string | null;
    present(options: ChangelogPresentOptions): Promise<void>;
    resetSeenVersions(): void;
  }

  export function getCurrentAppVersion(): string;
  export function getLatestSeenAppVersion(): string | null;
  export function getLatestSeenOTAVersion(): string | null;
  export function presentChangelog(
    options: ChangelogPresentOptions,
  ): Promise<void>;
  export function resetSeenChangelogVersions(): void;

  const module: ChangelogNativeModule;
  export default module;
}

declare module '@modules/ui-kit-webview' {
  import type * as React from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';

  export interface UIKitWebViewNavigationEvent {
    canGoBack: boolean;
    canGoForward: boolean;
    loading: boolean;
    title?: string | null;
    url: string;
  }

  export interface UIKitWebViewErrorEvent {
    code: number;
    description: string;
    domain: string;
    url: string;
  }

  export interface UIKitWebViewContentProcessTerminatedEvent {
    url: string;
  }

  export interface UIKitWebViewProps {
    allowsFullscreenVideo?: boolean;
    keyboardDisplayRequiresUserAction?: boolean;
    onContentProcessDidTerminate?: (event: {
      nativeEvent: UIKitWebViewContentProcessTerminatedEvent;
    }) => void;
    onError?: (event: { nativeEvent: UIKitWebViewErrorEvent }) => void;
    onLoadEnd?: (event: { nativeEvent: UIKitWebViewNavigationEvent }) => void;
    onLoadStart?: (event: { nativeEvent: UIKitWebViewNavigationEvent }) => void;
    onNavigationStateChange?: (event: {
      nativeEvent: UIKitWebViewNavigationEvent;
    }) => void;
    parent?: string;
    playerWebsiteUrl?: string;
    restrictNavigationToTwitchPlayer?: boolean;
    scrollEnabled?: boolean;
    style?: StyleProp<ViewStyle>;
    url: string;
  }

  export function UIKitWebView(props: UIKitWebViewProps): React.JSX.Element;
}
