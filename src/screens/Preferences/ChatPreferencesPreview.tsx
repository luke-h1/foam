import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { RichChatMessage } from '@app/components/Chat/components/ChatMessage/RichChatMessage';
import { createBaseMessage } from '@app/components/Chat/util/messageHandlers';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { ffzSanitiisedChannelBadges } from '@app/services/__fixtures__/badges/ffz/ffzSanitisedChannelBadges.fixture';
import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedGlobalBadges.fixture';
import { bttvSanitisedGlobalEmoteSet } from '@app/services/__fixtures__/emotes/bttv/bttvSanitisedGlobalEmoteSet.fixture';
import { ffzSanitisedGlobalEmoteSet } from '@app/services/__fixtures__/emotes/ffz/ffzSanitisedGlobalEmoteSet.fixture';
import { sevenTvSanitisedChannelEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedChannelEmoteSet.fixture';
import { twitchTvSanitisedEmoteSetGlobalFixture } from '@app/services/__fixtures__/emotes/twitch/twitchTvSanitisedEmoteSetGlobal.fixture';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { theme } from '@app/styles/themes';
import { type SanitisedEmote } from '@app/types/emote';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

const PREVIEW_CHANNEL = 'preview';
const PREVIEW_VIEWER_LOGIN = 'foamviewer';

type PreviewProvider = '7tv' | 'bttv' | 'ffz' | 'twitch';
type PreviewMessage = ReturnType<typeof createBaseMessage>;

type PreviewState = {
  chatDensity: 'comfortable' | 'compact';
  chatTimestamps: boolean;
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showUnreadJumpPill: boolean;
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

type PreviewBadgeSample =
  | {
      badge: SanitisedBadgeSet;
      type: 'badge';
    }
  | {
      accentColor: string;
      iconName: 'bttv' | 'stv';
      label: string;
      type: 'brand';
    };

const PREVIEW_DEFAULTS: PreviewState = {
  chatDensity: 'comfortable',
  chatTimestamps: true,
  highlightOwnMentions: true,
  showInlineReplyContext: true,
  showUnreadJumpPill: false,
};

const baseTagFields: Record<string, string> = {
  badges: '',
  'emote-sets': '',
  mod: '0',
  subscriber: '0',
  turbo: '0',
  'user-type': '',
  'reply-parent-msg-id': '',
  'reply-parent-msg-body': '',
  'reply-parent-display-name': '',
  'reply-parent-user-login': '',
};

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
      { type: 'text', content: 'Hey ' },
      { type: 'mention', content: `@${PREVIEW_VIEWER_LOGIN}` },
      { type: 'text', content: ' thanks for subscribing!' },
    ],
    userId: '103',
  }),
} as const;

const providerEmoteSamples: Record<PreviewProvider, SanitisedEmote[]> = {
  '7tv': sevenTvSanitisedChannelEmoteSetFixture.slice(0, 2),
  bttv: bttvSanitisedGlobalEmoteSet.slice(0, 2),
  ffz: ffzSanitisedGlobalEmoteSet.slice(0, 2),
  twitch: twitchTvSanitisedEmoteSetGlobalFixture.slice(0, 2),
};

const providerBadgeSamples: Record<PreviewProvider, PreviewBadgeSample[]> = {
  '7tv': [
    {
      accentColor: theme.colors.plum.accent,
      iconName: 'stv',
      label: '7TV badge',
      type: 'brand',
    },
  ],
  bttv: [
    {
      accentColor: theme.colors.orange.accent,
      iconName: 'bttv',
      label: 'BTTV badge',
      type: 'brand',
    },
  ],
  ffz: ffzSanitiisedChannelBadges.slice(0, 1).map(badge => ({
    badge,
    type: 'badge' as const,
  })),
  twitch: twitchSanitisedGlobalBadges
    .filter(badge => ['subscriber_0', 'premium_1'].includes(badge.id))
    .slice(0, 2)
    .map(badge => ({
      badge,
      type: 'badge' as const,
    })),
};

const parseTextForEmotes = (text: string) => [
  { type: 'text' as const, content: text },
];

const getMentionColor = () => '#9147FF';

export function ChatPreferencePreview(props: ChatPreferencePreviewProps) {
  const { variant } = props;

  switch (variant) {
    case 'density': {
      const { value } = props;

      return (
        <ChatPreviewSurface
          messages={[previewMessages.plain, previewMessages.reply]}
          settings={{ chatDensity: value }}
          testID="chat-preference-preview-density"
        />
      );
    }

    case 'timestamps': {
      const { value } = props;

      return (
        <ChatPreviewSurface
          messages={[previewMessages.plain]}
          settings={{ chatTimestamps: value }}
          testID="chat-preference-preview-timestamps"
        />
      );
    }

    case 'mentions': {
      const { value } = props;

      return (
        <ChatPreviewSurface
          messages={[previewMessages.mention]}
          settings={{ highlightOwnMentions: value }}
          testID="chat-preference-preview-mentions"
        />
      );
    }

    case 'inlineReply': {
      const { value } = props;

      return (
        <ChatPreviewSurface
          messages={[previewMessages.reply]}
          settings={{ showInlineReplyContext: value }}
          testID="chat-preference-preview-inline-reply"
        />
      );
    }

    case 'jumpPill': {
      const { value } = props;

      return (
        <ChatPreviewSurface
          messages={[previewMessages.plain, previewMessages.mention]}
          settings={{ showUnreadJumpPill: value }}
          testID="chat-preference-preview-jump-pill"
        />
      );
    }

    case 'providerEmotes': {
      const { provider, value } = props;

      return (
        <ProviderAssetPreview
          enabled={value}
          provider={provider}
          testID={`chat-preference-preview-${provider}-emotes`}
          variant="emotes"
        />
      );
    }

    case 'providerBadges': {
      const { provider, value } = props;

      return (
        <ProviderAssetPreview
          enabled={value}
          provider={provider}
          testID={`chat-preference-preview-${provider}-badges`}
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
  let previewContent: ReactNode;

  if (variant === 'emotes') {
    previewContent = enabled ? (
      <View style={styles.assetStrip}>
        {providerEmoteSamples[provider].map(sample => (
          <Image
            key={`${provider}-${sample.id}`}
            source={{ uri: sample.url }}
            style={styles.emoteSample}
            transition={0}
            useNitro
          />
        ))}
      </View>
    ) : (
      <Text color="gray.textLow" style={styles.tokenText}>
        {providerEmoteSamples[provider].map(sample => sample.name).join(' ')}
      </Text>
    );
  } else {
    previewContent = (
      <Text color="gray.textLow" style={styles.tokenText}>
        hello there
      </Text>
    );
  }

  return (
    <PreviewCard testID={testID}>
      <View style={styles.providerPreviewRow}>
        {variant === 'badges' && enabled ? (
          <View style={styles.assetStrip}>
            {providerBadgeSamples[provider].map(sample =>
              sample.type === 'badge' ? (
                <Image
                  key={`${provider}-${sample.badge.id}`}
                  source={sample.badge.url}
                  style={styles.badgeSample}
                  transition={0}
                  useNitro
                />
              ) : (
                <View
                  key={`${provider}-${sample.label}`}
                  style={styles.badgeFallback}
                >
                  <BrandIcon
                    color={sample.accentColor}
                    name={sample.iconName}
                    size="sm"
                  />
                </View>
              ),
            )}
          </View>
        ) : null}
        <Text style={styles.providerUsername} weight="semibold">
          username:
        </Text>
        {previewContent}
      </View>
    </PreviewCard>
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
  message?: PreviewMessage['message'];
  replyBody?: string;
  replyDisplayName?: string;
  replyLogin?: string;
  text?: string;
  userId: string;
}): PreviewMessage {
  const baseMessage = createBaseMessage({
    channelName: PREVIEW_CHANNEL,
    tags: {
      ...baseTagFields,
      color,
      'display-name': displayName,
      id,
      login,
      'reply-parent-display-name': replyDisplayName ?? '',
      'reply-parent-msg-body': replyBody ?? '',
      'reply-parent-user-login': replyLogin ?? '',
      'user-id': userId,
    },
    text: text ?? '',
  });

  return {
    ...baseMessage,
    message: message ?? baseMessage.message,
  };
}

const styles = StyleSheet.create({
  assetStrip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  badgeFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.ui,
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  badgeSample: {
    height: 20,
    width: 20,
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
  emoteSample: {
    height: 28,
    width: 28,
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
  tokenText: {
    fontSize: theme.font.fontSize.xs,
  },
});
