import { Section, Toggle } from '@expo/ui/swift-ui';

import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_PREFERENCE_ROWS as ROWS,
  PROVIDER_PREFERENCE_SECTIONS,
} from '../constants';
import type { ProviderPreferenceSection } from '../util/chatPreferenceTypes';
import { hostPreview } from './ChatPreferenceFormHostPreview';
import { ProviderPreviewItem } from './ChatPreferencePreviewWidgets';

interface ProviderFormSectionProps {
  section: ProviderPreferenceSection;
  previewWidth: number;
}

function ProviderFormSection({
  section,
  previewWidth,
}: ProviderFormSectionProps) {
  const emotesEnabled = usePreference(section.emotes.key);
  const badgesEnabled = usePreference(section.badges.key);

  return (
    <Section title={section.title}>
      <Toggle
        label={ROWS.providerEmotes.title}
        systemImage={ROWS.providerEmotes.icon}
        isOn={emotesEnabled}
        onIsOnChange={value =>
          updatePreferences({ [section.emotes.key]: value })
        }
      />
      {hostPreview(
        <ProviderPreviewItem
          enabled={emotesEnabled}
          provider={section.provider}
          variant='emotes'
        />,
        previewWidth,
        false,
      )}
      <Toggle
        label={ROWS.providerBadges.title}
        systemImage={ROWS.providerBadges.icon}
        isOn={badgesEnabled}
        onIsOnChange={value =>
          updatePreferences({ [section.badges.key]: value })
        }
      />
      {hostPreview(
        <ProviderPreviewItem
          enabled={badgesEnabled}
          provider={section.provider}
          variant='badges'
        />,
        previewWidth,
        false,
      )}
    </Section>
  );
}

export function ChatPreferenceFormProviderSections({
  previewWidth,
}: {
  previewWidth: number;
}) {
  return PROVIDER_PREFERENCE_SECTIONS.map(section => (
    <ProviderFormSection
      key={section.title}
      section={section}
      previewWidth={previewWidth}
    />
  ));
}
