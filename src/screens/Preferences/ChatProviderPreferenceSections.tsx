import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { theme } from '@app/styles/themes';
import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { ReactNode } from 'react';

type PreviewProvider = '7tv' | 'bttv' | 'ffz' | 'twitch';

const PROVIDER_COLORS: Record<PreviewProvider, string> = {
  '7tv': theme.colorPlum,
  bttv: theme.colorOrange,
  ffz: theme.colorBlue,
  twitch: theme.colorViolet,
};

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
      subtitle: 'Render 7TV emotes in chat',
    },
    badges: {
      key: 'show7tvBadges',
      subtitle: 'Render 7TV badges next to usernames',
    },
  },
  {
    title: 'BTTV',
    provider: 'bttv',
    emotes: {
      key: 'showBttvEmotes',
      subtitle: 'Render BetterTTV emotes in chat',
    },
    badges: {
      key: 'showBttvBadges',
      subtitle: 'Render BetterTTV badges next to usernames',
    },
  },
  {
    title: 'FFZ',
    provider: 'ffz',
    emotes: {
      key: 'showFFzEmotes',
      subtitle: 'Render FrankerFaceZ emotes in chat',
    },
    badges: {
      key: 'showFFzBadges',
      subtitle: 'Render FrankerFaceZ badges next to usernames',
    },
  },
  {
    title: 'Twitch',
    provider: 'twitch',
    emotes: {
      key: 'showTwitchEmotes',
      subtitle: 'Render native Twitch emotes in chat',
    },
    badges: {
      key: 'showTwitchBadges',
      subtitle: 'Render native Twitch badges next to usernames',
    },
  },
] as const satisfies readonly {
  badges: { key: ProviderPreviewKey; subtitle: string };
  emotes: { key: ProviderPreviewKey; subtitle: string };
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
  return (
    <>
      {PROVIDER_PREFERENCE_SECTIONS.map(section => {
        const tint = PROVIDER_COLORS[section.provider];
        return (
          <SettingsSection key={section.title} title={section.title}>
            <SettingsToggleRow
              title='Emotes'
              subtitle={section.emotes.subtitle}
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
              title='Badges'
              subtitle={section.badges.subtitle}
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
