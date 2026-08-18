import { Section, Toggle } from '@expo/ui/swift-ui';

import type { Preferences } from '@app/store/preferenceStore';

import { hostPreview } from './chatPreferenceFormHostPreview';
import { ProviderPreviewItem } from './ChatPreferencePreviewWidgets';
import type { PreviewProvider } from './chatPreferenceTypes';

type ProviderSection = {
  title: string;
  provider: PreviewProvider;
  emotes: boolean;
  badges: boolean;
  onEmotes: (value: boolean) => void;
  onBadges: (value: boolean) => void;
};

export function ChatPreferenceFormProviderSections({
  preferences,
  previewWidth,
  update,
}: {
  preferences: Preferences;
  previewWidth: number;
  update: (payload: Partial<Preferences>) => void;
}) {
  const providerSections: ProviderSection[] = [
    {
      title: '7TV',
      provider: '7tv',
      emotes: preferences.show7TvEmotes,
      badges: preferences.show7tvBadges,
      onEmotes: (value: boolean) => update({ show7TvEmotes: value }),
      onBadges: (value: boolean) => update({ show7tvBadges: value }),
    },
    {
      title: 'BTTV',
      provider: 'bttv',
      emotes: preferences.showBttvEmotes,
      badges: preferences.showBttvBadges,
      onEmotes: (value: boolean) => update({ showBttvEmotes: value }),
      onBadges: (value: boolean) => update({ showBttvBadges: value }),
    },
    {
      title: 'FFZ',
      provider: 'ffz',
      emotes: preferences.showFFzEmotes,
      badges: preferences.showFFzBadges,
      onEmotes: (value: boolean) => update({ showFFzEmotes: value }),
      onBadges: (value: boolean) => update({ showFFzBadges: value }),
    },
    {
      title: 'Twitch',
      provider: 'twitch',
      emotes: preferences.showTwitchEmotes,
      badges: preferences.showTwitchBadges,
      onEmotes: (value: boolean) => update({ showTwitchEmotes: value }),
      onBadges: (value: boolean) => update({ showTwitchBadges: value }),
    },
  ];

  return (
    <>
      {providerSections.map(section => (
        <Section key={section.title} title={section.title}>
          <Toggle
            label='Emotes'
            systemImage='face.smiling'
            isOn={section.emotes}
            onIsOnChange={section.onEmotes}
          />
          {hostPreview(
            <ProviderPreviewItem
              enabled={section.emotes}
              provider={section.provider}
              variant='emotes'
            />,
            previewWidth,
            false,
          )}
          <Toggle
            label='Badges'
            systemImage='rosette'
            isOn={section.badges}
            onIsOnChange={section.onBadges}
          />
          {hostPreview(
            <ProviderPreviewItem
              enabled={section.badges}
              provider={section.provider}
              variant='badges'
            />,
            previewWidth,
            false,
          )}
        </Section>
      ))}
    </>
  );
}
