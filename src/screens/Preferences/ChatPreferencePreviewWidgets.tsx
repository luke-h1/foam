import { Image } from '@app/components/Image/Image';
import { Text, type TextType } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { StyleSheet, View } from 'react-native';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import type {
  PreviewProvider,
  ProviderPreviewVariant,
} from './chatPreferenceTypes';
import { useTranslation } from 'react-i18next';

export const DensityPreview = function DensityPreview({
  density,
}: {
  density: 'comfortable' | 'compact';
}) {
  const compact = density === 'compact';

  return (
    <View style={[styles.previewPanel, compact && styles.previewPanelCompact]}>
      <PreviewMessage
        compact={compact}
        time='12:42'
        username='needlework'
        message='linework healed clean'
      />
      <PreviewMessage
        compact={compact}
        time='12:43'
        username='inkmod'
        message='shading pass is ready'
      />
    </View>
  );
};

const PreviewMessage = function PreviewMessage({
  compact,
  message,
  time,
  username,
}: {
  compact: boolean;
  message: string;
  time: string;
  username: string;
}) {
  const messageType: TextType = compact ? 'xxs' : 'caption';

  return (
    <View
      style={[styles.previewMessage, compact && styles.previewMessageCompact]}
    >
      <Text color='gray.textLow' style={styles.previewTime} type='xxs'>
        {time}
      </Text>
      <Text
        color='accent.accentHover'
        type={messageType}
        weight='bold'
        style={styles.previewUsername}
      >
        {username}
      </Text>
      <Text color='gray' type={messageType} style={styles.previewText}>
        {message}
      </Text>
    </View>
  );
};

export const EmojiStylePreview = function EmojiStylePreview({
  emotes,
}: {
  emotes: SanitisedEmote[];
}) {
  return (
    <View style={styles.previewPanel}>
      <View style={styles.emojiPreviewRow}>
        {emotes.map(emote => (
          <View key={`${emote.site}-${emote.name}`} style={styles.emojiTile}>
            <Image
              cachePolicy='memory-disk'
              contentFit='contain'
              source={{ uri: emote.url }}
              style={styles.emojiImage}
              transition={0}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export function PreviewLabel() {
  const { t } = useTranslation('preferences');

  return (
    <Text color='gray.textLow' type='xxs' weight='semibold'>
      {t('preview')}
    </Text>
  );
}

export const ProviderPreviewItem = function ProviderPreviewItem({
  enabled,
  provider,
  variant,
}: {
  enabled: boolean;
  provider: PreviewProvider;
  variant: ProviderPreviewVariant;
}) {
  return (
    <View style={styles.providerPreviewItem}>
      <ChatPreferencePreview
        provider={provider}
        variant={variant === 'emotes' ? 'providerEmotes' : 'providerBadges'}
        value={enabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emojiImage: {
    height: 28,
    width: 28,
  },
  emojiPreviewRow: {
    flexDirection: 'row',
    gap: theme.space8,
  },
  emojiTile: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    borderColor: theme.colorBorderSecondary,
    borderRadius: theme.borderRadius6,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iosSwitchSlot: {
    alignItems: 'flex-end',
    flexShrink: 0,
    width: 76,
  },
  previewMessage: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 30,
  },
  previewMessageCompact: {
    gap: theme.space4,
    minHeight: 20,
  },
  previewPanel: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.colorBorderSecondary,
    borderRadius: theme.borderRadius6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.space4,
    padding: theme.space8,
  },
  previewPanelCompact: {
    gap: theme.space2,
    paddingVertical: theme.space4,
  },
  previewText: {
    flex: 1,
  },
  previewTime: {
    minWidth: 34,
  },
  previewUsername: {
    flexShrink: 0,
  },
  providerPreviewItem: {
    gap: theme.space8,
    paddingBottom: theme.space12,
    paddingHorizontal: 20,
    paddingTop: theme.space4,
  },
});
