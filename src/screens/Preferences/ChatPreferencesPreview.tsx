import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { EmoteRenderer } from '@app/components/Chat/components/ChatMessage/renderers/EmoteRenderer';
import { RichChatMessage } from '@app/components/Chat/components/ChatMessage/RichChatMessage';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { type ChatMessageType } from '@app/store/chat/types/constants';
import { type ChatFontScale } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { type UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { type SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { type ParsedPart } from '@app/utils/chat/parsedPart';
import { getParsedPartStringContent } from '@app/utils/chat/parsedPartContent';
import { replaceTextWithEmotes } from '@app/utils/chat/replaceTextWithEmotes';

import { chatPreferencePreviewFixtures } from './fixtures/chatPreferencePreviewFixtures';

const PREVIEW_CHANNEL = 'preview';
const PREVIEW_VIEWER_LOGIN = 'foamviewer';

type PreviewProvider = '7tv' | 'bttv' | 'ffz' | 'twitch';
type PreviewMessage = ChatMessageType<'usernotice'>;

type PreviewState = {
  chatDensity: 'comfortable' | 'compact';
  chatFontScale: ChatFontScale;
  chatTimestamps: boolean;
  disableEmoteAnimations: boolean;
  highlightOwnMentions: boolean;
  showAlternatingChatRows: boolean;
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
      variant: 'fontScale';
      value: PreviewState['chatFontScale'];
    }
  | {
      variant: 'context';
      value: Partial<PreviewState>;
    }
  | {
      variant: 'alternatingRows';
      value: boolean;
    }
  | {
      variant: 'timestamps' | 'mentions' | 'inlineReply' | 'jumpPill';
      value: boolean;
    }
  | {
      variant: 'emoteAnimations';
      value: boolean;
    }
  | {
      provider: PreviewProvider;
      value: boolean;
      variant: 'providerEmotes' | 'providerBadges';
    };

const PREVIEW_DEFAULTS: PreviewState = {
  chatDensity: 'comfortable',
  chatFontScale: 'default',
  chatTimestamps: true,
  disableEmoteAnimations: false,
  highlightOwnMentions: true,
  showAlternatingChatRows: false,
  showInlineReplyContext: true,
  showUnreadJumpPill: false,
};

const previewMessages = {
  plain: createPreviewMessage({
    color: theme.color.chatSample.blue,
    displayName: 'StreamEnjoyer',
    id: 'preview-plain',
    login: 'streamenjoyer',
    text: 'This overlay is so clean',
    userId: '101',
  }),
  reply: createPreviewMessage({
    color: theme.color.chatSample.green,
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
    color: theme.color.chatSample.purple,
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
  emoteAnimations: createPreviewMessage({
    color: theme.color.chatSample.amber,
    displayName: 'EmoteFan',
    id: 'preview-emote-animations',
    login: 'emotefan',
    message: [
      textPart(' these render '),
      ...buildProviderEmoteParts(
        'bttv',
        chatPreferencePreviewFixtures.bttv.emotes.slice(0, 2),
      ),
    ],
    userId: '104',
  }),
} as const;

const getMentionColor = () => theme.colorViolet;

const parseTextForEmotes = (text: string): ParsedPart[] => [textPart(text)];

export const ChatPreferencePreview = memo(function ChatPreferencePreview(
  props: ChatPreferencePreviewProps,
) {
  const { variant, value } = props;

  switch (variant) {
    case 'density': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.plain, previewMessages.reply]}
          settings={{ chatDensity: value }}
          testID='chat-preference-preview-density'
        />
      );
    }

    case 'fontScale': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.plain, previewMessages.reply]}
          settings={{ chatFontScale: value }}
          testID='chat-preference-preview-font-scale'
        />
      );
    }

    case 'context': {
      return (
        <ChatPreviewSurface
          messages={[
            previewMessages.plain,
            previewMessages.reply,
            previewMessages.mention,
          ]}
          settings={value}
          testID='chat-preference-preview-context'
        />
      );
    }

    case 'timestamps': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.plain]}
          settings={{ chatTimestamps: value }}
          testID='chat-preference-preview-timestamps'
        />
      );
    }

    case 'alternatingRows': {
      return (
        <ChatPreviewSurface
          messages={[
            previewMessages.plain,
            previewMessages.reply,
            previewMessages.mention,
          ]}
          settings={{ showAlternatingChatRows: value }}
          testID='chat-preference-preview-alternating-rows'
        />
      );
    }

    case 'mentions': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.mention]}
          settings={{ highlightOwnMentions: value }}
          testID='chat-preference-preview-mentions'
        />
      );
    }

    case 'inlineReply': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.reply]}
          settings={{ showInlineReplyContext: value }}
          testID='chat-preference-preview-inline-reply'
        />
      );
    }

    case 'jumpPill': {
      return (
        <ChatPreviewSurface
          messages={[previewMessages.plain, previewMessages.mention]}
          settings={{ showUnreadJumpPill: value }}
          testID='chat-preference-preview-jump-pill'
        />
      );
    }

    case 'emoteAnimations': {
      return (
        <PreviewEmoteLine
          disableAnimations={value}
          parts={previewMessages.emoteAnimations.message}
          testID='chat-preference-preview-emote-animations'
          username='EmoteFan'
          usernameColor={theme.color.chatSample.amber}
        />
      );
    }

    case 'providerEmotes': {
      const { provider } = props;
      return (
        <ProviderAssetPreview
          enabled={value}
          provider={provider}
          testID={`chat-preference-preview-${provider}-emotes`}
          variant='emotes'
        />
      );
    }

    case 'providerBadges': {
      const { provider } = props;
      return (
        <ProviderAssetPreview
          enabled={value}
          provider={provider}
          testID={`chat-preference-preview-${provider}-badges`}
          variant='badges'
        />
      );
    }

    default: {
      const unreachable: never = variant;
      return unreachable;
    }
  }
});

const ChatPreviewSurface = function ChatPreviewSurface({
  label,
  messages,
  settings,
  testID,
}: {
  label?: string;
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
        pointerEvents='none'
      >
        {messages.map((message, index) => (
          <RichChatMessage
            key={message.id}
            {...message}
            currentUsername={
              previewState.highlightOwnMentions
                ? PREVIEW_VIEWER_LOGIN
                : undefined
            }
            density={previewState.chatDensity}
            disableEmoteAnimations={previewState.disableEmoteAnimations}
            fontScale={previewState.chatFontScale}
            getMentionColor={getMentionColor}
            isAlternatingRow={
              previewState.showAlternatingChatRows && index % 2 === 1
            }
            parseTextForEmotes={parseTextForEmotes}
            showInlineReplyContext={previewState.showInlineReplyContext}
            showTimestamp={previewState.chatTimestamps}
            style={styles.messageRow}
          />
        ))}

        {previewState.showUnreadJumpPill ? (
          <View style={styles.jumpPillWrap}>
            <View style={styles.jumpPill}>
              <SymbolView
                tintColor={theme.colorAmberAlpha}
                name='arrow.down'
                size={16}
              />
              <Text style={styles.jumpPillText} weight='semibold'>
                Jump to latest
              </Text>
              <Text style={styles.jumpPillCount} weight='bold'>
                {' '}
                3
              </Text>
            </View>
          </View>
        ) : null}
        {label ? (
          <View style={styles.previewStatePill}>
            <Text style={styles.previewStatePillText} weight='semibold'>
              {label}
            </Text>
          </View>
        ) : null}
      </View>
    </PreviewCard>
  );
};

/**
 * Renders `username: text [emote] text` with plain primitives. The full
 * RichChatMessage flex body collapses its standalone text nodes to a few pixels
 * inside the RNHostView-embedded SwiftUI form, so the words vanish; EmoteRenderer
 * still measures correctly and keeps the animation toggle for the emote parts.
 */
const PreviewEmoteLine = function PreviewEmoteLine({
  disableAnimations = false,
  parts,
  testID,
  username,
  usernameColor,
}: {
  disableAnimations?: boolean;
  parts: ParsedPart[];
  testID: string;
  username: string;
  usernameColor: string;
}) {
  return (
    <PreviewCard testID={testID}>
      <View style={styles.providerPreviewSurface} pointerEvents='none'>
        <View style={styles.providerEmoteRow}>
          <Text style={{ color: usernameColor }} type='caption' weight='bold'>
            {username}:
          </Text>
          {parts.map(part => {
            if (part.type === 'emote') {
              return (
                <EmoteRenderer
                  key={`emote-${part.name}`}
                  disableAnimations={disableAnimations}
                  part={part}
                  targetSize={24}
                />
              );
            }

            const content = getParsedPartStringContent(part).trim();
            if (!content) {
              return null;
            }

            return (
              <Text key={`text-${content}`} color='gray' type='caption'>
                {content}
              </Text>
            );
          })}
        </View>
      </View>
    </PreviewCard>
  );
};

const ProviderAssetPreview = function ProviderAssetPreview({
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
  const sample = getProviderPreviewSample(provider);

  if (variant === 'emotes' && enabled && sample.emotes.length > 0) {
    return (
      <PreviewEmoteLine
        parts={buildProviderEmoteParts(provider, sample.emotes)}
        testID={testID}
        username='username'
        usernameColor={getProviderPreviewColor(provider)}
      />
    );
  }

  const message =
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
        });

  return (
    <PreviewCard testID={testID}>
      <View style={styles.providerPreviewSurface} pointerEvents='none'>
        <RichChatMessage
          {...message}
          density='comfortable'
          getMentionColor={getMentionColor}
          parseTextForEmotes={parseTextForEmotes}
          showInlineReplyContext={false}
          showTimestamp={false}
          style={styles.messageRow}
        />
      </View>
    </PreviewCard>
  );
};

const PreviewCard = function PreviewCard({
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
};

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
): ProviderPreviewSample {
  const fixtures = chatPreferencePreviewFixtures[provider];

  return {
    badges: fixtures.badges.slice(0, provider === 'twitch' ? 2 : 1),
    emotes: fixtures.emotes.slice(0, 2),
  };
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
      provider === 'ffz' ? emotes.filter(emote => emote.site === 'FFZ') : [],
    ffzGlobalEmotes:
      provider === 'ffz'
        ? emotes.filter(emote => emote.site === 'Global FFZ')
        : [],
    bttvChannelEmotes:
      provider === 'bttv' ? emotes.filter(emote => emote.site === 'BTTV') : [],
    bttvGlobalEmotes:
      provider === 'bttv'
        ? emotes.filter(emote => emote.site === 'Global BTTV')
        : [],
  });
}

function getProviderPreviewColor(provider: PreviewProvider) {
  switch (provider) {
    case '7tv':
      return theme.colorPlum;
    case 'bttv':
      return theme.colorOrange;
    case 'ffz':
      return theme.colorBlue;
    case 'twitch':
      return theme.colorViolet;
    default: {
      const unreachable: never = provider;
      return unreachable;
    }
  }
}

const styles = StyleSheet.create({
  chatSurface: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: theme.space8,
    position: 'relative',
  },
  chatSurfaceWithJumpPill: {
    paddingBottom: 52,
  },
  jumpPill: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colorBlackOverlay,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)',
    flexDirection: 'row',
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space12,
  },
  jumpPillCount: {
    fontSize: theme.fontSize12,
  },
  jumpPillText: {
    fontSize: theme.fontSize12,
  },
  jumpPillWrap: {
    bottom: theme.space12,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  messageRow: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space2,
  },
  previewCard: {
    width: '100%',
  },
  previewStatePill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colorBlackOverlay,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    marginHorizontal: theme.space12,
    marginTop: theme.space8,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space4,
  },
  previewStatePillText: {
    color: theme.colorWhite,
    fontSize: theme.fontSize12,
  },
  providerEmoteRow: {
    alignItems: 'center',
    columnGap: theme.space4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.space12,
    rowGap: theme.space2,
  },
  providerPreviewSurface: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
    overflow: 'hidden',
    paddingVertical: theme.space8,
  },
});
