import { BrandIcon, type BrandIconName } from '@app/components/BrandIcon/BrandIcon';
import { RichChatMessage } from '@app/components/Chat/components/ChatMessage/RichChatMessage';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { type ChatMessageType } from '@app/store/chatStore/constants';
import { type UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { type ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

const PREVIEW_CHANNEL = 'preview';
const PREVIEW_VIEWER_LOGIN = 'foamviewer';

type PreviewProvider = '7tv' | 'bttv' | 'ffz' | 'twitch';
type PreviewMessage = ChatMessageType<'usernotice'>;

type PreviewState = {
  chatDensity: 'comfortable' | 'compact';
  chatTimestamps: boolean;
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showUnreadJumpPill: boolean;
};

type PreviewBadgeSample = {
  accentColor: string;
  iconName?: BrandIconName;
  label: string;
};

type ProviderPreviewSample = {
  accentColor: string;
  badgeSamples: PreviewBadgeSample[];
  emoteSamples: string[];
};

export type ChatPreferencePreviewProps =
  | {
      variant: 'density';
      value: PreviewState['chatDensity'];
    }
  | {
      variant: 'timestamps' | 'mentions' | 'inlineReply' | 'jumpPill';
      value: boolean;
    }
  | {
      provider: PreviewProvider;
      value: boolean;
      variant: 'providerEmotes' | 'providerBadges';
    };

const PREVIEW_DEFAULTS: PreviewState = {
  chatDensity: 'comfortable',
  chatTimestamps: true,
  highlightOwnMentions: true,
  showInlineReplyContext: true,
  showUnreadJumpPill: false,
};

const providerPreviewSamples = {
  '7tv': {
    accentColor: theme.colors.plum.accent,
    badgeSamples: [
      {
        accentColor: theme.colors.plum.accent,
        iconName: 'stv',
        label: '7TV',
      },
    ],
    emoteSamples: ['yePls', 'monkaW'],
  },
  bttv: {
    accentColor: theme.colors.orange.accent,
    badgeSamples: [
      {
        accentColor: theme.colors.orange.accent,
        iconName: 'bttv',
        label: 'BTTV',
      },
    ],
    emoteSamples: ['FeelsStrongMan', 'PepeHands'],
  },
  ffz: {
    accentColor: theme.colors.blue.accent,
    badgeSamples: [
      {
        accentColor: theme.colors.blue.accent,
        label: 'FFZ',
      },
    ],
    emoteSamples: ['PepoG', 'catJAM'],
  },
  twitch: {
    accentColor: theme.colors.violet.accent,
    badgeSamples: [
      {
        accentColor: theme.colors.violet.accent,
        label: 'SUB',
      },
      {
        accentColor: theme.colors.amber.accent,
        label: 'VIP',
      },
    ],
    emoteSamples: ['Kappa', 'PogChamp'],
  },
} satisfies Record<PreviewProvider, ProviderPreviewSample>;

const previewMessages = {
  plain: createPreviewMessage({
    color: '#1E90FF',
    displayName: 'StreamEnjoyer',
    id: 'preview-plain',
    login: 'streamenjoyer',
    text: 'This overlay is so clean',
    userId: '101',
  }),
  reply: createPreviewMessage({
    color: '#3CB371',
    displayName: 'ChatFan',
    id: 'preview-reply',
    login: 'chatfan',
    replyBody: 'Love this game choice',
    replyDisplayName: 'StreamEnjoyer',
    replyLogin: 'streamenjoyer',
    text: 'Totally agree!',
    userId: '102',
  }),
  mention: createPreviewMessage({
    color: '#C084FC',
    displayName: 'ModBot',
    id: 'preview-mention',
    login: 'modbot',
    message: [
      textPart('Hey '),
      mentionPart(`@${PREVIEW_VIEWER_LOGIN}`),
      textPart(' thanks for subscribing!'),
    ],
    userId: '103',
  }),
} as const;

const getMentionColor = () => theme.colors.violet.accent;

const parseTextForEmotes = (text: string): ParsedPart[] => [textPart(text)];

export function ChatPreferencePreview(props: ChatPreferencePreviewProps) {
  const { variant } = props;

  switch (variant) {
    case 'density': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.plain, previewMessages.reply]}
          settings={{ chatDensity: props.value }}
          testID="chat-preference-preview-density"
        />
      );
    }

    case 'timestamps': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.plain]}
          settings={{ chatTimestamps: props.value }}
          testID="chat-preference-preview-timestamps"
        />
      );
    }

    case 'mentions': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.mention]}
          settings={{ highlightOwnMentions: props.value }}
          testID="chat-preference-preview-mentions"
        />
      );
    }

    case 'inlineReply': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.reply]}
          settings={{ showInlineReplyContext: props.value }}
          testID="chat-preference-preview-inline-reply"
        />
      );
    }

    case 'jumpPill': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.plain, previewMessages.mention]}
          settings={{ showUnreadJumpPill: props.value }}
          testID="chat-preference-preview-jump-pill"
        />
      );
    }

    case 'providerEmotes': {
      return (
        <ProviderAssetPreview
          enabled={props.value}
          provider={props.provider}
          testID={`chat-preference-preview-${props.provider}-emotes`}
          variant="emotes"
        />
      );
    }

    case 'providerBadges': {
      return (
        <ProviderAssetPreview
          enabled={props.value}
          provider={props.provider}
          testID={`chat-preference-preview-${props.provider}-badges`}
          variant="badges"
        />
      );
    }

    default: {
      const unreachable: never = props;
      return unreachable;
    }
  }
}

function ChatPreviewSurface({
  messages,
  settings,
  testID,
}: {
  messages: PreviewMessage[];
  settings?: Partial<PreviewState>;
  testID: string;
}) {
  const previewState = {
    ...PREVIEW_DEFAULTS,
    ...settings,
  };

  return (
    <PreviewCard testID={testID}>
      <View
        style={[
          styles.chatSurface,
          previewState.showUnreadJumpPill
            ? styles.chatSurfaceWithJumpPill
            : null,
        ]}
        pointerEvents="none"
      >
        {messages.map(message => (
          <RichChatMessage
            key={message.id}
            {...message}
            currentUsername={
              previewState.highlightOwnMentions
                ? PREVIEW_VIEWER_LOGIN
                : undefined
            }
            density={previewState.chatDensity}
            getMentionColor={getMentionColor}
            parseTextForEmotes={parseTextForEmotes}
            showInlineReplyContext={previewState.showInlineReplyContext}
            showTimestamp={previewState.chatTimestamps}
            style={styles.messageRow}
          />
        ))}

        {previewState.showUnreadJumpPill ? (
          <View style={styles.jumpPillWrap}>
            <View style={styles.jumpPill}>
              <Icon
                color={theme.colors.amber.accentAlpha}
                icon="arrow-down"
                size={16}
              />
              <Text style={styles.jumpPillText} weight="semibold">
                Jump to latest
              </Text>
              <Text style={styles.jumpPillCount} weight="bold">
                {' '}
                3
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </PreviewCard>
  );
}

function ProviderAssetPreview({
  enabled,
  provider,
  testID,
  variant,
}: {
  enabled: boolean;
  provider: PreviewProvider;
  testID: string;
  variant: 'badges' | 'emotes';
}) {
  const sample = providerPreviewSamples[provider];

  return (
    <PreviewCard testID={testID}>
      <View style={styles.providerPreviewRow}>
        {variant === 'badges' && enabled ? (
          <View style={styles.assetStrip}>
            {sample.badgeSamples.map(badge => (
              <PreviewChip
                key={`${provider}-${badge.label}`}
                accentColor={badge.accentColor}
                iconName={badge.iconName}
                kind="badge"
                label={badge.label}
              />
            ))}
          </View>
        ) : null}

        <Text style={styles.providerUsername} weight="semibold">
          username:
        </Text>

        {variant === 'emotes' ? (
          enabled ? (
            <>
              <Text color="gray.textLow" style={styles.providerMessageText}>
                hello
              </Text>
              <View style={styles.assetStrip}>
                {sample.emoteSamples.map(emote => (
                  <PreviewChip
                    key={`${provider}-${emote}`}
                    accentColor={sample.accentColor}
                    kind="emote"
                    label={emote}
                  />
                ))}
              </View>
              <Text color="gray.textLow" style={styles.providerMessageText}>
                world
              </Text>
            </>
          ) : (
            <Text color="gray.textLow" style={styles.providerMessageText}>
              {sample.emoteSamples.join(' ')} hello world
            </Text>
          )
        ) : (
          <Text color="gray.textLow" style={styles.providerMessageText}>
            hello world
          </Text>
        )}
      </View>
    </PreviewCard>
  );
}

function PreviewChip({
  accentColor,
  iconName,
  kind,
  label,
}: {
  accentColor: string;
  iconName?: BrandIconName;
  kind: 'badge' | 'emote';
  label: string;
}) {
  return (
    <View
      style={[
        styles.previewChip,
        kind === 'badge' ? styles.badgeChip : styles.emoteChip,
        { borderColor: accentColor },
      ]}
    >
      {iconName ? <BrandIcon color={accentColor} name={iconName} size="xs" /> : null}
      <Text style={[styles.previewChipText, { color: accentColor }]} weight="semibold">
        {label}
      </Text>
    </View>
  );
}

function PreviewCard({
  children,
  testID,
}: {
  children: ReactNode;
  testID: string;
}) {
  return (
    <View style={styles.previewCard} testID={testID}>
      {children}
    </View>
  );
}

function createPreviewMessage({
  color,
  displayName,
  id,
  login,
  message,
  replyBody,
  replyDisplayName,
  replyLogin,
  text,
  userId,
}: {
  color: string;
  displayName: string;
  id: string;
  login: string;
  message?: ParsedPart[];
  replyBody?: string;
  replyDisplayName?: string;
  replyLogin?: string;
  text?: string;
  userId: string;
}): PreviewMessage {
  const userstate: UserStateTags = {
    'display-name': displayName,
    login,
    username: displayName,
    'user-id': userId,
    id,
    color,
    badges: {},
    'badges-raw': '',
    mod: '0',
    subscriber: '0',
    turbo: '0',
    'emote-sets': '',
    'user-type': '',
    'first-msg': '0',
    'reply-parent-msg-id': '',
    'reply-parent-msg-body': replyBody ?? '',
    'reply-parent-display-name': replyDisplayName ?? '',
    'reply-parent-user-login': replyLogin ?? '',
  };

  return {
    id,
    userstate,
    message: message ?? [textPart(text ?? '')],
    badges: [],
    channel: PREVIEW_CHANNEL,
    message_id: id,
    message_nonce: `${id}-nonce`,
    sender: login,
    parentDisplayName: replyDisplayName ?? '',
    replyDisplayName: replyLogin ?? '',
    replyBody: replyBody ?? '',
    parentColor: undefined,
  };
}

function textPart(content: string): ParsedPart<'text'> {
  return {
    type: 'text',
    content,
  };
}

function mentionPart(content: string): ParsedPart<'mention'> {
  return {
    type: 'mention',
    content,
  };
}

const styles = StyleSheet.create({
  assetStrip: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  badgeChip: {
    minHeight: 20,
    paddingHorizontal: theme.spacing.xs,
  },
  chatSurface: {
    backgroundColor: theme.colors.gray.bg,
    borderColor: theme.colors.gray.borderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingTop: theme.spacing.xs,
    position: 'relative',
  },
  chatSurfaceWithJumpPill: {
    paddingBottom: 52,
  },
  emoteChip: {
    minHeight: 24,
    paddingHorizontal: theme.spacing.sm,
  },
  jumpPill: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.black.bgAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    elevation: 5,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    shadowColor: theme.colors.black.accentAlpha,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  jumpPillCount: {
    fontSize: theme.font.fontSize.xs,
  },
  jumpPillText: {
    fontSize: theme.font.fontSize.xs,
  },
  jumpPillWrap: {
    bottom: theme.spacing.sm,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  messageRow: {
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxHeight: 480,
    paddingHorizontal: theme.spacing.sm,
  },
  previewCard: {
    paddingTop: theme.spacing.xs,
  },
  previewChip: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.ui,
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  previewChipText: {
    fontSize: theme.font.fontSize.xxs,
  },
  providerMessageText: {
    fontSize: theme.font.fontSize.xs,
  },
  providerPreviewRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.bg,
    borderColor: theme.colors.gray.borderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  providerUsername: {
    color: theme.colors.gray.text,
  },
});
