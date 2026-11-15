import { ListItem, Text } from '@expo/ui/jetpack-compose';

import { theme } from '@app/styles/themes';

interface SettingsRowTextProps {
  title: string;
  subtitle?: string;
  danger?: boolean;
}

export function SettingsRowText({
  title,
  subtitle,
  danger,
}: SettingsRowTextProps) {
  return (
    <>
      <ListItem.HeadlineContent>
        <Text
          color={danger ? theme.colorRed : theme.color.text.dark}
          style={{ typography: 'titleMedium' }}
        >
          {title}
        </Text>
      </ListItem.HeadlineContent>
      {subtitle ? (
        <ListItem.SupportingContent>
          <Text
            color={theme.color.textSecondary.dark}
            style={{ typography: 'bodyMedium' }}
          >
            {subtitle}
          </Text>
        </ListItem.SupportingContent>
      ) : null}
    </>
  );
}
