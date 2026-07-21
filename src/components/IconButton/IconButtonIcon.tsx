import { ActivityIndicator, useColorScheme } from 'react-native';

import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { resolveSpacingValue, Spacing } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';

type IconType =
  | {
      color?: string;
      name: SymbolViewProps['name'];
      size?: number;
      type: 'symbol';
    }
  | SymbolViewProps['name'];

export function IconButtonIcon({
  icon,
  loading,
  size = 'md',
}: {
  icon: IconType;
  loading?: boolean;
  size?: Spacing;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  if (loading) {
    return <ActivityIndicator color={theme.color.text[scheme]} />;
  }

  if (typeof icon === 'string' || !('type' in icon)) {
    return (
      <SymbolView
        name={icon}
        size={resolveSpacingValue(theme, size)}
        tintColor={theme.color.textSecondary[scheme]}
      />
    );
  }

  if (icon.type === 'symbol') {
    return (
      <SymbolView
        name={icon.name}
        size={icon.size ?? resolveSpacingValue(theme, size)}
        tintColor={icon.color ?? theme.color.textSecondary[scheme]}
      />
    );
  }

  return null;
}
