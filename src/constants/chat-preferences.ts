import type { SFSymbol } from 'sf-symbols-typescript';

export interface PreferenceOption<Value> {
  label: string;
  value: Value;
}

export interface ContextPreviewValue {
  chatTimestamps: boolean;
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showUnreadJumpPill: boolean;
}

export interface ContextToggleRow {
  key: keyof ContextPreviewValue;
  label: string;
  subtitle: string;
  icon: SFSymbol;
}

export const DENSITY_OPTIONS = [
  {
    label: 'Comfortable',
    value: 'comfortable',
    subtitle: 'More space between rows',
  },
  {
    label: 'Compact',
    value: 'compact',
    subtitle: 'Tighter rows for faster scanning',
  },
] as const satisfies readonly (PreferenceOption<'comfortable' | 'compact'> & {
  subtitle: string;
})[];

export const CONTEXT_TOGGLE_ROWS = [
  {
    key: 'chatTimestamps',
    label: 'Show Timestamps',
    subtitle: 'Show the time beside each message',
    icon: 'clock',
  },
  {
    key: 'highlightOwnMentions',
    label: 'Highlight Own Mentions',
    subtitle: 'Accent messages that mention your username',
    icon: 'at',
  },
  {
    key: 'showInlineReplyContext',
    label: 'Inline Reply Context',
    subtitle: 'Show the replied-to message above responses',
    icon: 'arrowshape.turn.up.left',
  },
  {
    key: 'showUnreadJumpPill',
    label: 'Show Jump Pill',
    subtitle: 'Show a button to jump to new messages',
    icon: 'arrow.down.circle',
  },
] as const satisfies readonly ContextToggleRow[];
