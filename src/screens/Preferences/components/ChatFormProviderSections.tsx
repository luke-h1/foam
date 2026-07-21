import { useTranslation } from 'react-i18next';

import { Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';

import { usePreferences } from '@app/store/preferences/selectors';

import type { PreviewProvider } from '../types/chatPreferenceTypes';
import { hostPreview } from './chatFormPreview';
import { ProviderPreviewItem } from './ChatPreferencePreviewWidgets';
import { ChatPreferencePreview } from './ChatPreferencesPreview';

export function ChatFormProviderSections({
  previewWidth,
}: {
  previewWidth: number;
}) {
  const { t } = useTranslation('preferences');
  const preferences = usePreferences();
  const { update } = preferences;

  const providerSections = [
    {
      title: '7TV',
      provider: '7tv' as PreviewProvider,
      emotes: preferences.show7TvEmotes,
      badges: preferences.show7tvBadges,
      onEmotes: (value: boolean) => update({ show7TvEmotes: value }),
      onBadges: (value: boolean) => update({ show7tvBadges: value }),
    },
    {
      title: 'BTTV',
      provider: 'bttv' as PreviewProvider,
      emotes: preferences.showBttvEmotes,
      badges: preferences.showBttvBadges,
      onEmotes: (value: boolean) => update({ showBttvEmotes: value }),
      onBadges: (value: boolean) => update({ showBttvBadges: value }),
    },
    {
      title: 'FFZ',
      provider: 'ffz' as PreviewProvider,
      emotes: preferences.showFFzEmotes,
      badges: preferences.showFFzBadges,
      onEmotes: (value: boolean) => update({ showFFzEmotes: value }),
      onBadges: (value: boolean) => update({ showFFzBadges: value }),
    },
    {
      title: 'Twitch',
      provider: 'twitch' as PreviewProvider,
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
            label={t('emotes')}
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
            label={t('badges')}
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

      <Section
        title={t('media')}
        footer={<NativeText>{t('mediaFooter')}</NativeText>}
      >
        <Toggle
          label={t('disableEmoteAnimations')}
          systemImage='slash.circle'
          isOn={preferences.disableEmoteAnimations}
          onIsOnChange={value => update({ disableEmoteAnimations: value })}
        />
        {hostPreview(
          <ChatPreferencePreview
            variant='emoteAnimations'
            value={preferences.disableEmoteAnimations}
          />,
          previewWidth,
        )}
      </Section>
    </>
  );
}
