import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { theme } from '@app/styles/themes';
import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type PreviewProvider = '7tv' | 'bttv' | 'ffz' | 'twitch';

const EMOTES_ICON: SFSymbol = 'face.smiling';
const EMOTES_ANDROID_ICON: AndroidSymbol = 'sentiment_satisfied';
const BADGES_ICON: SFSymbol = 'rosette';
const BADGES_ANDROID_ICON: AndroidSymbol = 'military_tech';

type ProviderPreviewKey =
  | 'show7TvEmotes'
  | 'show7tvBadges'
  | 'showBttvEmotes'
  | 'showBttvBadges'
  | 'showFFzEmotes'
  | 'showFFzBadges'
  | 'showTwitchEmotes'
  | 'showTwitchBadges';

type ProviderPreviewValue = Record<ProviderPreviewKey, boolean>;

const PROVIDER_PREFERENCE_SECTIONS = [
  {
    title: '7TV',
    provider: '7tv',
    emotes: {
      key: 'show7TvEmotes',
      subtitleKey: 'sevenTvEmotesDescription',
    },
    badges: {
      key: 'show7tvBadges',
      subtitleKey: 'sevenTvBadgesDescription',
    },
  },
  {
    title: 'BTTV',
    provider: 'bttv',
    emotes: {
      key: 'showBttvEmotes',
      subtitleKey: 'bttvEmotesDescription',
    },
    badges: {
      key: 'showBttvBadges',
      subtitleKey: 'bttvBadgesDescription',
    },
  },
  {
    title: 'FFZ',
    provider: 'ffz',
    emotes: {
      key: 'showFFzEmotes',
      subtitleKey: 'ffzEmotesDescription',
    },
    badges: {
      key: 'showFFzBadges',
      subtitleKey: 'ffzBadgesDescription',
    },
  },
  {
    title: 'Twitch',
    provider: 'twitch',
    emotes: {
      key: 'showTwitchEmotes',
      subtitleKey: 'twitchEmotesDescription',
    },
    badges: {
      key: 'showTwitchBadges',
      subtitleKey: 'twitchBadgesDescription',
    },
  },
] as const satisfies readonly {
  badges: { key: ProviderPreviewKey; subtitleKey: string };
  emotes: { key: ProviderPreviewKey; subtitleKey: string };
  provider: PreviewProvider;
  title: string;
}[];

type ProviderPreviewItemProps = {
  enabled: boolean;
  provider: PreviewProvider;
  variant: 'badges' | 'emotes';
};

export function ChatProviderPreferenceSections({
  onProviderToggle,
  previewProviders,
  ProviderPreviewItem,
}: {
  previewProviders: ProviderPreviewValue;
  onProviderToggle: (key: ProviderPreviewKey, value: boolean) => void;
  ProviderPreviewItem: (props: ProviderPreviewItemProps) => ReactNode;
}) {
  const { t } = useTranslation('preferences');

  return (
    <>
      {PROVIDER_PREFERENCE_SECTIONS.map(section => {
        const tint = theme.colorGrey;
        return (
          <SettingsSection key={section.title} title={section.title}>
            <SettingsToggleRow
              title={t('emotes')}
              subtitle={t(section.emotes.subtitleKey)}
              icon={{
                icon: EMOTES_ICON,
                androidIcon: EMOTES_ANDROID_ICON,
                color: tint,
              }}
              value={previewProviders[section.emotes.key]}
              onValueChange={value =>
                onProviderToggle(section.emotes.key, value)
              }
            />
            <ProviderPreviewItem
              enabled={previewProviders[section.emotes.key]}
              provider={section.provider}
              variant='emotes'
            />
            <SettingsToggleRow
              title={t('badges')}
              subtitle={t(section.badges.subtitleKey)}
              icon={{
                icon: BADGES_ICON,
                androidIcon: BADGES_ANDROID_ICON,
                color: tint,
              }}
              value={previewProviders[section.badges.key]}
              onValueChange={value =>
                onProviderToggle(section.badges.key, value)
              }
            />
            <ProviderPreviewItem
              enabled={previewProviders[section.badges.key]}
              provider={section.provider}
              variant='badges'
            />
          </SettingsSection>
        );
      })}
    </>
  );
}
