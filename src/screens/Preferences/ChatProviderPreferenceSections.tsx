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
} from './chatPreferenceTypes';

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

export function ChatProviderPreferenceSections({
  onProviderToggle,
  previewProviders,
}: {
  previewProviders: ProviderPreviewValue;
  onProviderToggle: (key: ProviderPreviewKey, value: boolean) => void;
}) {
  return (
    <>
      {PROVIDER_PREFERENCE_SECTIONS.map(section => {
        const tint = theme.colorGrey;
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
