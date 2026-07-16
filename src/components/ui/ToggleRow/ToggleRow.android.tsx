import { ListItem, RNHostView, Switch, Text } from '@expo/ui/jetpack-compose';
import { SymbolViewProps } from 'expo-symbols';

import { theme } from '@app/styles/themes';

import { SymbolView } from '../Icon/Icon';
import { ToggleRowProps } from './ToggleRow.types';

const listItemColors = {
  containerColor: theme.color.backgroundSecondary.dark,
  contentColor: theme.color.text.dark,
};

export function ToggleRow({
  title,
  subtitle,
  icon,
  value,
  onValueChange,
}: ToggleRowProps) {
  return (
    <ListItem colors={listItemColors}>
      {icon ? (
        <ListItem.LeadingContent>
          <RNHostView matchContents>
            <SymbolView
              name={icon as SymbolViewProps['name']}
              size={20}
              tintColor={theme.colorWhite}
            />
          </RNHostView>
        </ListItem.LeadingContent>
      ) : null}
      <ListItem.HeadlineContent>
        <Text color={theme.color.text.dark} style={{ typography: 'bodyLarge' }}>
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
      <ListItem.TrailingContent>
        <Switch value={value} onCheckedChange={onValueChange} />
      </ListItem.TrailingContent>
    </ListItem>
  );
}
