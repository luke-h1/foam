import { useTranslation } from 'react-i18next';

import type { SFSymbol } from 'sf-symbols-typescript';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import type { AndroidSymbol } from '@app/components/ui/Icon/Icon';
import { theme } from '@app/styles/themes';

import { ProviderPreviewItem } from './ChatPreferencePreviewWidgets';
import type {
  PreviewProvider,
  ProviderPreviewKey,
  ProviderPreviewValue,
} from './types/chatPreferenceTypes';

const EMOTES_ICON: SFSymbol = 'face.smiling';
const EMOTES_ANDROID_ICON: AndroidSymbol = 'sentiment_satisfied';
const BADGES_ICON: SFSymbol = 'rosette';
const BADGES_ANDROID_ICON: AndroidSymbol = 'military_tech';

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

export function ChatProviderPreferenceSections({
  onProviderToggle,
  previewProviders,
}: {
  previewProviders: ProviderPreviewValue;
  onProviderToggle: (key: ProviderPreviewKey, value: boolean) => void;
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
