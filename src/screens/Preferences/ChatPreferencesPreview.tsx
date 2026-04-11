import { RichChatMessage } from '@app/components/Chat/components/ChatMessage/RichChatMessage';
import { Icon } from '@app/components/Icon/Icon';
import { type SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import {
  type ChannelCacheType,
  type ChatMessageType,
} from '@app/store/chatStore/constants';
import { chatStore$ } from '@app/store/chatStore/state';
import { type UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { type SanitisedEmote } from '@app/types/emote';
import {
  replaceTextWithEmotes,
  type ParsedPart,
} from '@app/utils/chat/replaceTextWithEmotes';
import { useSelector } from '@legendapp/state/react';
import { type ReactNode, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { chatPreferencePreviewFixtures } from './chatPreferencePreviewFixtures';

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

type ProviderPreviewSample = {
  badges: SanitisedBadgeSet[];
  emotes: SanitisedEmote[];
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
  const channelCaches = useSelector(chatStore$.persisted.channelCaches);
  const cachedBadges = useSelector(chatStore$.badges);
  const sample = useMemo(
    () => getProviderPreviewSample(provider, channelCaches, cachedBadges),
    [provider, channelCaches, cachedBadges],
  );
  const message = useMemo(
    () =>
      variant === 'emotes'
        ? createPreviewMessage({
            color: getProviderPreviewColor(provider),
            displayName: 'username',
            id: `preview-${provider}-emotes-${enabled ? 'on' : 'off'}`,
            login: `${provider}-preview`,
            message: enabled
              ? buildProviderEmoteParts(provider, sample.emotes)
              : [textPart(buildProviderEmoteFallbackText(sample.emotes))],
            userId: `preview-${provider}-emotes`,
          })
        : createPreviewMessage({
            badges: enabled ? sample.badges : [],
            color: getProviderPreviewColor(provider),
            displayName: 'username',
            id: `preview-${provider}-badges-${enabled ? 'on' : 'off'}`,
            login: `${provider}-preview`,
            text: ' hello world',
            userId: `preview-${provider}-badges`,
          }),
    [enabled, provider, sample.badges, sample.emotes, variant],
  );

  return (
    <PreviewCard testID={testID}>
      <View style={styles.providerPreviewSurface} pointerEvents="none">
        <RichChatMessage
          {...message}
          density="comfortable"
          getMentionColor={getMentionColor}
          parseTextForEmotes={parseTextForEmotes}
          showInlineReplyContext={false}
          showTimestamp={false}
          style={styles.messageRow}
        />
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
  badges = [],
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
  badges?: SanitisedBadgeSet[];
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
    badges,
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

function getProviderPreviewSample(
  provider: PreviewProvider,
  channelCaches: Record<string, ChannelCacheType>,
  cachedBadges: Record<string, SanitisedBadgeSet>,
): ProviderPreviewSample {
  const fallback = chatPreferencePreviewFixtures[provider];

  return {
    emotes: fillPreviewItems(
      getLiveProviderEmotes(provider, channelCaches),
      fallback.emotes,
      2,
      item => item.id,
    ),
    badges: fillPreviewItems(
      getLiveProviderBadges(provider, channelCaches, cachedBadges),
      fallback.badges,
      provider === 'twitch' ? 2 : 1,
      badge => `${badge.set}:${badge.id}`,
    ),
  };
}

function fillPreviewItems<T>(
  liveItems: T[],
  fallbackItems: T[],
  count: number,
  getKey: (item: T) => string,
): T[] {
  const result: T[] = [];
  const seen = new Set<string>();

  [liveItems, fallbackItems].forEach(items => {
    items.forEach(item => {
      const key = getKey(item);
      if (seen.has(key) || result.length >= count) {
        return;
      }
      seen.add(key);
      result.push(item);
    });
  });

  return result;
}

function sortCachesByFreshness(channelCaches: Record<string, ChannelCacheType>) {
  return Object.values(channelCaches).sort(
    (left, right) => (right.lastUpdated || 0) - (left.lastUpdated || 0),
  );
}

function getLiveProviderEmotes(
  provider: PreviewProvider,
  channelCaches: Record<string, ChannelCacheType>,
): SanitisedEmote[] {
  const caches = sortCachesByFreshness(channelCaches);
  const emotes: SanitisedEmote[] = [];

  caches.forEach(cache => {
    switch (provider) {
      case '7tv':
        emotes.push(...cache.sevenTvChannelEmotes, ...cache.sevenTvGlobalEmotes);
        break;
      case 'bttv':
        emotes.push(...cache.bttvChannelEmotes, ...cache.bttvGlobalEmotes);
        break;
      case 'ffz':
        emotes.push(...cache.ffzChannelEmotes, ...cache.ffzGlobalEmotes);
        break;
      case 'twitch':
        emotes.push(...cache.twitchChannelEmotes, ...cache.twitchGlobalEmotes);
        break;
      default: {
        const unreachable: never = provider;
        return unreachable;
      }
    }
  });

  return emotes;
}

function getLiveProviderBadges(
  provider: PreviewProvider,
  channelCaches: Record<string, ChannelCacheType>,
  cachedBadges: Record<string, SanitisedBadgeSet>,
): SanitisedBadgeSet[] {
  if (provider === '7tv') {
    return Object.values(cachedBadges).filter(
      badge => badge.provider === '7tv' || badge.type === '7TV Badge',
    );
  }

  if (provider === 'bttv') {
    return Object.values(cachedBadges).filter(
      badge => badge.provider === 'bttv' || badge.type === 'BTTV Badge',
    );
  }

  const caches = sortCachesByFreshness(channelCaches);
  const badges: SanitisedBadgeSet[] = [];

  caches.forEach(cache => {
    switch (provider) {
      case 'ffz':
        badges.push(...cache.ffzChannelBadges, ...cache.ffzGlobalBadges);
        break;
      case 'twitch':
        badges.push(...cache.twitchChannelBadges, ...cache.twitchGlobalBadges);
        break;
      default:
        break;
    }
  });

  return badges;
}

function buildProviderEmoteFallbackText(emotes: SanitisedEmote[]) {
  return ` hello ${emotes.map(emote => emote.name).join(' ')} world`;
}

function buildProviderEmoteParts(
  provider: PreviewProvider,
  emotes: SanitisedEmote[],
): ParsedPart[] {
  if (emotes.length === 0) {
    return [textPart(' hello world')];
  }

  return replaceTextWithEmotes({
    inputString: buildProviderEmoteFallbackText(emotes),
    userstate: null,
    sevenTvChannelEmotes:
      provider === '7tv'
        ? emotes.filter(emote => emote.site === '7TV Channel')
        : [],
    sevenTvGlobalEmotes:
      provider === '7tv'
        ? emotes.filter(emote => emote.site === '7TV Global')
        : [],
    sevenTvPersonalEmotes:
      provider === '7tv'
        ? emotes.filter(emote => emote.site === '7TV Personal')
        : [],
    twitchChannelEmotes:
      provider === 'twitch'
        ? emotes.filter(emote => emote.site === 'Twitch Channel')
        : [],
    twitchGlobalEmotes:
      provider === 'twitch'
        ? emotes.filter(emote => emote.site === 'Twitch Global')
        : [],
    ffzChannelEmotes:
      provider === 'ffz'
        ? emotes.filter(emote => emote.site === 'FFZ')
        : [],
    ffzGlobalEmotes:
      provider === 'ffz'
        ? emotes.filter(emote => emote.site === 'Global FFZ')
        : [],
    bttvChannelEmotes:
      provider === 'bttv'
        ? emotes.filter(emote => emote.site === 'BTTV')
        : [],
    bttvGlobalEmotes:
      provider === 'bttv'
        ? emotes.filter(emote => emote.site === 'Global BTTV')
        : [],
  });
}

function getProviderPreviewColor(provider: PreviewProvider) {
  switch (provider) {
    case '7tv':
      return theme.colors.plum.accent;
    case 'bttv':
      return theme.colors.orange.accent;
    case 'ffz':
      return theme.colors.blue.accent;
    case 'twitch':
      return theme.colors.violet.accent;
    default: {
      const unreachable: never = provider;
      return unreachable;
    }
  }
}

const styles = StyleSheet.create({
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
  providerPreviewSurface: {
    backgroundColor: theme.colors.gray.bg,
    borderColor: theme.colors.gray.borderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    overflow: 'hidden',
    paddingVertical: theme.spacing.xs,
  },
});
