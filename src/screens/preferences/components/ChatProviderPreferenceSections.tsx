import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/SettingsSection';
import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_PREFERENCE_ROWS as ROWS,
  PROVIDER_PREFERENCE_SECTIONS,
} from '../constants';
import type { ProviderPreferenceSection } from '../util/chatPreferenceTypes';
import { ProviderPreviewItem } from './ChatPreferencePreviewWidgets';

function ProviderSection({ section }: { section: ProviderPreferenceSection }) {
  const emotesEnabled = usePreference(section.emotes.key);
  const badgesEnabled = usePreference(section.badges.key);

  return (
    <SettingsSection title={section.title}>
      <SettingsToggleRow
        title={ROWS.providerEmotes.title}
        subtitle={section.emotes.subtitle}
        icon={ROWS.providerEmotes}
        value={emotesEnabled}
        onValueChange={value =>
          updatePreferences({ [section.emotes.key]: value })
        }
      />
      <ProviderPreviewItem
        enabled={emotesEnabled}
        provider={section.provider}
        variant='emotes'
      />
      <SettingsToggleRow
        title={ROWS.providerBadges.title}
        subtitle={section.badges.subtitle}
        icon={ROWS.providerBadges}
        value={badgesEnabled}
        onValueChange={value =>
          updatePreferences({ [section.badges.key]: value })
        }
      />
      <ProviderPreviewItem
        enabled={badgesEnabled}
        provider={section.provider}
        variant='badges'
      />
    </SettingsSection>
  );
}

export function ChatProviderPreferenceSections() {
  return PROVIDER_PREFERENCE_SECTIONS.map(section => (
    <ProviderSection key={section.title} section={section} />
  ));
}
